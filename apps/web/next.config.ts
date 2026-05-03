import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'p30dgk3d-3000.inc1.devtunnels.ms',
      ],
    },
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
