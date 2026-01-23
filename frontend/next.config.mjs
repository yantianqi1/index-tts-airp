/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 将 /api 请求代理到 GPU 后端服务器
    const backendUrl = process.env.BACKEND_URL || 'http://i-2.gpushare.com:35808';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
