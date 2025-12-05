import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages on the server
      config.externals = config.externals || [];
      config.externals.push('groq-sdk', 'node-fetch', 'formdata-node', 'agentkeepalive');
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['groq-sdk', 'node-fetch', 'formdata-node', 'agentkeepalive'],
  },
};

export default nextConfig;
