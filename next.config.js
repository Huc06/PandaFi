/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Fix for PubNub and other packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        // Fix for Web3 wallet dependencies
        encoding: false,
        "pino-pretty": false,
        "@react-native-async-storage/async-storage": false,
      };
    }

    // Ignore optional dependencies warnings
    config.ignoreWarnings = [
      { module: /node-fetch/ },
      { module: /pino/ },
      { module: /@metamask\/sdk/ },
    ];

    return config;
  },
};

module.exports = nextConfig;
