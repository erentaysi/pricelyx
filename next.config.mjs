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
        hostname: 'm.media-amazon.com',
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
      },
      {
        protocol: 'https',
        hostname: 'www.lg.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.e-bebek.com',
      },
      {
        protocol: 'https',
        hostname: '**.toyzzshop.com',
      }
    ],
  },
};

export default nextConfig;
