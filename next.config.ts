import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Security: Disable x-powered-by header
  poweredByHeader: false,

  // Security: Content Security Policy & other headers
  async headers() {
    // In dev mode, Next.js needs 'unsafe-eval' for HMR/fast refresh
    // In production, use strict CSP without eval
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Security: Restrict image domains
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
};

export default withNextIntl(nextConfig);
