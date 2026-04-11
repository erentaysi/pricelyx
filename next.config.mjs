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
        hostname: '**.dsmcdn.com', // Trendyol dynamic CDNs
      },
      {
        protocol: 'https',
        hostname: '**.hepsiburada.net', // Hepsiburada dynamic CDNs
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com', // Amazon dynamic CDNs
      },
      {
        protocol: 'https',
        hostname: '**.akamaized.net', // Akamai based CDNs (N11 etc)
      },
      {
        protocol: 'https',
        hostname: '**.ciceksepeti.com',
      }
    ],
  },
};

export default nextConfig;
