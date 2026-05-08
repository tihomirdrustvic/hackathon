/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        fs: false,
        path: false,
        os: false,
        buffer: require.resolve('buffer/'),
      };
    }
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
