import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, generateCsrfToken, setCsrfCookie, isCsrfExempt, requiresCsrf } from './lib/csrf';

const intlMiddleware = createMiddleware(routing);

// Security headers applied to all responses
const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
};

// Simple API rate limiter in middleware (first-line defense, per-process)
// Redis-based rate limiting is done at the API route level as second line
const apiRateMap = new Map<string, { count: number; reset: number }>();
const API_RATE_LIMIT = 60; // requests per window
const API_RATE_WINDOW = 60 * 1000; // 1 minute

// Clean up old rate limit entries every 5 minutes (prevent memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of apiRateMap.entries()) {
        if (now > entry.reset) apiRateMap.delete(key);
    }
}, 5 * 60 * 1000);

function getIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') || '127.0.0.1';
}

function applySecurityHeaders(response: NextResponse): void {
    for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
    }
}

function ensureCsrfCookie(req: NextRequest, response: NextResponse): void {
    // Skip for /api/csrf - that route sets its own cookie
    if (req.nextUrl.pathname === '/api/csrf') return;
    if (!req.cookies.get('csrf-token')) {
        const token = generateCsrfToken();
        setCsrfCookie(response, token);
    }
}

export default function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // API routes handling
    if (pathname.startsWith('/api')) {
        const ip = getIP(req);

        // Rate limiting (first line of defense)
        const key = `api:${ip}`;
        const now = Date.now();
        const entry = apiRateMap.get(key);

        if (!entry || now > entry.reset) {
            apiRateMap.set(key, { count: 1, reset: now + API_RATE_WINDOW });
        } else {
            entry.count++;
            if (entry.count > API_RATE_LIMIT) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many requests' }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': String(Math.ceil((entry.reset - now) / 1000)),
                            ...securityHeaders,
                        },
                    }
                );
            }
        }

        // CSRF validation for mutating requests
        if (requiresCsrf(req.method) && !isCsrfExempt(pathname)) {
            if (!validateCsrf(req)) {
                return new NextResponse(
                    JSON.stringify({ error: 'Invalid or missing CSRF token' }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json',
                            ...securityHeaders,
                        },
                    }
                );
            }
        }

        // Pass through with security headers
        const response = NextResponse.next();
        applySecurityHeaders(response);
        ensureCsrfCookie(req, response);
        return response;
    }

    // For non-API routes, run intl middleware and add security headers + CSRF cookie
    const response = intlMiddleware(req);
    applySecurityHeaders(response);
    ensureCsrfCookie(req, response);
    return response;
}

export const config = {
    matcher: ['/', '/(ar|en|ku)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};