/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Для Railway и production
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['t.me', 'telegram.org'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Разрешаем открытие Mini App внутри Telegram WebView
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://t.me https://*.telegram.org https://web.telegram.org;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;


