import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api-gateway:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
