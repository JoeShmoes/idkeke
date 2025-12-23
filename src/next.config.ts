
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '/tmp/build',
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
