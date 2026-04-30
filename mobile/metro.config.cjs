const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Socket.io / engine.io module resolution issues
config.resolver.sourceExts.push('mjs');

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });