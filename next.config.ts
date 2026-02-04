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
  // Turbopack config (пустой, чтобы убрать warning)
  turbopack: {},
  // Webpack config для Tailwind CSS - fix fs module error (fallback для non-Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Headers для Content Security Policy - разрешаем Telegram iframe
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://oauth.telegram.org",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
