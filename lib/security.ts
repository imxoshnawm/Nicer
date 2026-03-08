import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { redisRateLimit } from './redis';

// ============================================================
// Rate Limiter - Redis with in-memory fallback
// ============================================================
// Uses Redis when REDIS_URL is set (distributed across processes)
// Falls back to in-memory Map per-process when Redis is unavailable

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old in-memory entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    return '127.0.0.1';
}

// In-memory rate limiter (fallback)
function memoryRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): { success: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, remaining: maxRequests - 1 };
    }

    entry.count++;
    if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { success: false, remaining: 0, retryAfter };
    }

    return { success: true, remaining: maxRequests - entry.count };
}

export async function rateLimit(
    req: NextRequest,
    options: { maxRequests: number; windowMs: number; keyPrefix?: string }
): Promise<{ success: boolean; remaining: number; retryAfter?: number }> {
    const { maxRequests, windowMs, keyPrefix = 'global' } = options;
    const ip = getClientIP(req);
    const key = `${keyPrefix}:${ip}`;

    // Try Redis first
    const redisResult = await redisRateLimit(key, maxRequests, windowMs);
    if (redisResult) return redisResult;

    // Fall back to in-memory
    return memoryRateLimit(key, maxRequests, windowMs);
}

export function rateLimitResponse(retryAfter: number): NextResponse {
    return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
        }
    );
}

// ============================================================
// Authentication & Authorization Helpers
// ============================================================

export async function requireAuth(
    allowedRoles?: string[]
): Promise<{ authorized: true; session: any } | { authorized: false; response: NextResponse }> {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
        };
    }

    // Re-check blocked status from DB (prevents blocked users from using stale JWTs)
    const userId = (session.user as any).id;
    if (userId) {
        try {
            const { default: dbConnect } = await import('@/lib/mongodb');
            const { default: User } = await import('@/lib/models/User');
            await dbConnect();
            const dbUser = await User.findById(userId).select('blocked roles').lean();
            if (!dbUser || (dbUser as any).blocked) {
                return {
                    authorized: false,
                    response: NextResponse.json({ error: 'Account is blocked' }, { status: 403 }),
                };
            }
            // Sync roles from DB to ensure JWT hasn't been tampered with
            (session.user as any).roles = (dbUser as any).roles || ['member'];
        } catch {
            // If DB check fails, deny access for safety
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Authentication verification failed' }, { status: 500 }),
            };
        }
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles: string[] = (session.user as any).roles || [(session.user as any).role || 'member'];
        const hasPermission = allowedRoles.some(r => userRoles.includes(r));
        if (!hasPermission) {
            return {
                authorized: false,
                response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
            };
        }
    }

    return { authorized: true, session };
}

// ============================================================
// Input Validation & Sanitization
// ============================================================

// Strip HTML tags to prevent XSS
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>]/g, '')    // Remove remaining angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
        .replace(/data:/gi, '')  // Remove data: protocol
        .trim();
}

// Sanitize an object's string values recursively
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = { ...obj };
    for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = sanitizeString(sanitized[key]);
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
            sanitized[key] = sanitizeObject(sanitized[key]);
        }
    }
    return sanitized;
}

// Email validation
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
        return { valid: false, message: 'Password must be less than 128 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: 'Password is strong' };
}

// MongoDB ObjectId validation
export function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
}

// Validate image URL (only allow safe protocols)
export function isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    if (url.length > 2048) return false;
    return /^(\/uploads\/|https?:\/\/)/.test(url);
}

// Validate string length
export function validateStringLength(
    value: string,
    fieldName: string,
    min: number,
    max: number
): { valid: boolean; message: string } {
    if (!value || typeof value !== 'string') {
        return { valid: false, message: `${fieldName} is required` };
    }
    if (value.trim().length < min) {
        return { valid: false, message: `${fieldName} must be at least ${min} characters` };
    }
    if (value.length > max) {
        return { valid: false, message: `${fieldName} must be less than ${max} characters` };
    }
    return { valid: true, message: '' };
}

// ============================================================
// Safe Error Response (never leak internal details)
// ============================================================
export function safeErrorResponse(error: unknown, statusCode: number = 500): NextResponse {
    // Log the actual error server-side for debugging
    console.error('[API Error]:', error);

    // Never return internal error details to the client
    if (statusCode === 500) {
        return NextResponse.json(
            { error: 'An internal error occurred. Please try again later.' },
            { status: 500 }
        );
    }

    // For client errors (4xx), we can include a generic message
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: statusCode });
}

// ============================================================
// Request Body Parser with size limit
// ============================================================
export async function parseBody(req: NextRequest, maxSizeBytes: number = 1024 * 1024): Promise<any> {
    // Read actual body text to enforce real size limit (not just Content-Length header)
    const text = await req.text();
    if (text.length > maxSizeBytes) {
        throw new Error('Request body too large');
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new Error('Invalid JSON body');
    }
}

// ============================================================
// Allowed Fields Filter (prevent mass assignment attacks)
// ============================================================
export function pickFields<T extends Record<string, any>>(
    obj: T,
    allowedFields: string[]
): Partial<T> {
    const result: any = {};
    for (const field of allowedFields) {
        if (obj.hasOwnProperty(field) && obj[field] !== undefined) {
            result[field] = obj[field];
        }
    }
    return result;
}
