/** @type {import('next').NextConfig} */
const nextConfig = {
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
    output: 'export',
    distDir: 'build',
};

export default nextConfig;
