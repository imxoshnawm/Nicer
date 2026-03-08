import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// CSRF Protection - Double Submit Cookie Pattern
// ============================================================
// How it works:
// 1. Server sets a random token in a non-httpOnly cookie (csrf-token)
// 2. Client reads the cookie via JavaScript
// 3. Client sends the token as X-CSRF-Token header on mutating requests
// 4. Server validates header matches cookie
//
// This works because:
// - Attackers can't read cookies from other origins (Same-Origin Policy)
// - Attackers can't set custom headers via HTML form submission
// - So only legitimate clients can provide the matching header

// Generate a cryptographically random CSRF token (Edge-compatible)
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Validate CSRF token: header must match cookie
export function validateCsrf(req: NextRequest): boolean {
    const headerToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;

    if (!headerToken || !cookieToken) return false;
    if (headerToken.length !== cookieToken.length) return false;

    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < headerToken.length; i++) {
        result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
    }
    return result === 0;
}

// Set CSRF cookie on a response
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set('csrf-token', token, {
        httpOnly: false, // Client JS needs to read this
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60, // 8 hours, matches session
    });
    return response;
}

// Paths exempt from CSRF validation
const CSRF_EXEMPT_PATHS = [
    '/api/auth',    // NextAuth has its own CSRF protection
    '/api/csrf',    // Token endpoint itself
    '/api/seed',    // Protected by secret token via header
    '/api/chat',    // Public AI chatbot endpoint (rate limited)
];

export function isCsrfExempt(pathname: string): boolean {
    return CSRF_EXEMPT_PATHS.some(p => pathname.startsWith(p));
}

// HTTP methods that require CSRF validation
const CSRF_REQUIRED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function requiresCsrf(method: string): boolean {
    return CSRF_REQUIRED_METHODS.includes(method.toUpperCase());
}
