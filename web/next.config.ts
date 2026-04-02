import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,  // required for static export
    remotePatterns: [{ protocol: "https", hostname: "api.dicebear.com" }],
  },
};

export default nextConfig;
