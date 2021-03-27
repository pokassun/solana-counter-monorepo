/* eslint-disable @typescript-eslint/no-var-requires */
const withPlugins = require('next-compose-plugins');
const { join } = require('path');

const workspace = join(__dirname, '..');

const nextJsConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  webpack: (config, options) => {
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [workspace],
          exclude: /node_modules/,
          use: options.defaultLoaders.babel
        }
      ]
    };
    if (!options.isServer) {
      config.node = {
        fs: 'empty'
      };
    }
    return config;
  }
};

module.exports = withPlugins([], nextJsConfig);
