/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;

