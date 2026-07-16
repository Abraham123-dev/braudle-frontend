/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js <Image> to optimize images from these external origins
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',       // Cloudflare R2 public bucket (uploaded avatars/thumbnails)
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth profile pictures
      },
    ],
  },

  async headers() {
    return [
      {
        // Long-lived immutable cache for hashed static assets (JS/CSS/fonts/images in _next/static)
        // Next.js content-hashes every file so this is 100% safe — a new build = new filename.
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Enforce security baseline on every page response
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
