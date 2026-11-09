import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build mandiri untuk Docker (lihat frontend/Dockerfile)
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;
