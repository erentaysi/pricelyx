/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gocwltgntiiklxwljdin.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.dsmcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.hepsiburada.net',
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.akamaized.net',
      },
      {
        protocol: 'https',
        hostname: '**.ciceksepeti.com',
      },
      {
        protocol: 'https',
        hostname: '**.trendyol.com',
      }
    ],
  },
};

export default nextConfig;
