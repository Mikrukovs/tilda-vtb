import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убрали static export для поддержки API routes и SSR
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 't.me',
      },
      {
        protocol: 'https',
        hostname: 'api.telegram.org',
      },
    ],
  },
  // Experimental features для App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
