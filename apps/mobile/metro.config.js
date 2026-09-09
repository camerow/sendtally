// getDefaultConfig detects the pnpm workspace and sets watchFolders and
// nodeModulesPaths itself. Overriding them dropped entries Expo now supplies,
// which is what `expo-doctor` flags.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
