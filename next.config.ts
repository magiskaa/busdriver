import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.173', '192.168.1.5', '192.168.0.56', 'dev.antiservu.xyz'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "**.convex.site" },
    ],
  },
};

export default nextConfig;
