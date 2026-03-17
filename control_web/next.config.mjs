/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://20.164.16.171:8000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
