const { withAndroidManifest, withAndroidStyles } = require("expo/config-plugins");

const DEPRECATED_EDGE_TO_EDGE_ITEMS = ["android:statusBarColor", "android:navigationBarColor"];

module.exports = function withAndroidPlayCompliance(config) {
  config = withAndroidManifest(config, (mod) => {
    for (const activity of mod.modResults.manifest.application?.[0]?.activity ?? []) {
      delete activity.$["android:screenOrientation"];
    }
    return mod;
  });

  return withAndroidStyles(config, (mod) => {
    for (const style of mod.modResults.resources.style ?? []) {
      style.item = style.item.filter(
        (item) => !DEPRECATED_EDGE_TO_EDGE_ITEMS.includes(item.$.name)
      );
    }
    return mod;
  });
};
