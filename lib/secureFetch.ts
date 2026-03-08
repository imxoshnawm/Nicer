'use client';

// ============================================================
// CSRF-aware Fetch Wrapper (Client-Side)
// ============================================================
// Automatically reads the CSRF token from cookie and adds it
// as X-CSRF-Token header on all mutating requests.
// Drop-in replacement for fetch() in client components.

function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// Fetch a new CSRF token if cookie doesn't exist yet
let csrfFetchPromise: Promise<string | null> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
    let token = getCsrfToken();
    if (token) return token;

    // Avoid duplicate requests
    if (!csrfFetchPromise) {
        csrfFetchPromise = fetch('/api/csrf')
            .then(r => r.json())
            .then(data => {
                csrfFetchPromise = null;
                return data.token || null;
            })
            .catch(() => {
                csrfFetchPromise = null;
                return null;
            });
    }

    return csrfFetchPromise;
}

// Methods that require CSRF tokens
const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * CSRF-aware fetch wrapper.
 * Automatically adds X-CSRF-Token header for POST/PUT/DELETE/PATCH requests.
 * Use this instead of fetch() for all API calls in client components.
 */
export async function secureFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = (options.method || 'GET').toUpperCase();

    if (MUTATING_METHODS.includes(method)) {
        const token = await ensureCsrfToken();
        if (token) {
            const headers = new Headers(options.headers);
            headers.set('X-CSRF-Token', token);
            options = { ...options, headers };
        }
    }

    return fetch(url, options);
}

export default secureFetch;
