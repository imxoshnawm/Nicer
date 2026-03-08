import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

// GET /api/csrf - Generate and return a CSRF token
// Also sets the token as a cookie
export async function GET() {
    const token = generateCsrfToken();
    const response = NextResponse.json({ token });
    setCsrfCookie(response, token);
    return response;
}
