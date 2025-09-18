import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    qualities: [75, 90, 100], // Configuração de qualidades suportadas
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Aumenta o limite para 100MB para PDFs grandes
    },
  },
};

export default nextConfig;
