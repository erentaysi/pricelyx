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
        hostname: 'cdn.dsmcdn.com', // Trendyol
      },
      {
        protocol: 'https',
        hostname: 'productimages.hepsiburada.net', // Hepsiburada
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com', // Amazon
      },
      {
        protocol: 'https',
        hostname: 'n11-image.akamaized.net', // N11
      },
      {
        protocol: 'https',
        hostname: 'cdn03.ciceksepeti.com', // Ciceksepeti
      }
    ],
  },
};

export default nextConfig;
