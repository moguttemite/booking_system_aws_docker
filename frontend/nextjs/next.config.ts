import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // 启用 standalone 模式用于 Docker 部署
  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bizplus-inc.co.jp',
        pathname: '/wp-content/themes/bizplus/images/**',
      },
    ],
  },
};

export default nextConfig;
