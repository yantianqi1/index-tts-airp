/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 开发环境下将 /api 请求代理到后端
    const backendPort = process.env.BACKEND_PORT || '8081';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${backendPort}`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
