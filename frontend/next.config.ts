import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // 启用 WebAssembly 支持
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
