import type { NextConfig } from 'next';

const securityHeaders = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'same-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
    // Self-contained server bundle for the Docker image.
    output: 'standalone',
    reactStrictMode: true,
    poweredByHeader: false,
    // Don't let lockfiles in parent folders change the workspace root.
    turbopack: { root: process.cwd() },
    outputFileTracingRoot: process.cwd(),
    experimental: {
        // Room for 25 MB attachments plus multipart overhead.
        serverActions: { bodySizeLimit: '26mb' },
        proxyClientMaxBodySize: '26mb',
    },
    async headers() {
        return [
            { source: '/:path*', headers: securityHeaders },
            // Always fetch the latest service worker.
            { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
        ];
    },
};

export default nextConfig;
