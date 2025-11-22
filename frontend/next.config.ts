import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // 处理 WASM 文件
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // 确保 WASM 文件被正确处理
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });

    // 在服务器端，将 walrus 相关包标记为外部包，避免在服务器端打包 WASM
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@mysten/walrus': 'commonjs @mysten/walrus',
        '@mysten/walrus-wasm': 'commonjs @mysten/walrus-wasm',
      });
    } else {
      // 在客户端，确保 WASM 文件可以被正确加载
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
  // 将 walrus 相关包排除在服务器组件外部包之外，避免在服务器端处理
  experimental: {
    serverComponentsExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm'],
  },
};

export default nextConfig;
