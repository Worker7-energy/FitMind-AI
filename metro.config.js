const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const customConfig = {
  server: {
    port: 8088,
  },
};

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
