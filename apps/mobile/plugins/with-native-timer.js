const { withInfoPlist } = require("expo/config-plugins");

/**
 * The running timer on the Lock Screen and in the Dynamic Island, kept moving by its own cue
 * audio in the background. Android declares its service in the module's own manifest.
 */
module.exports = function withNativeTimer(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.NSSupportsLiveActivities = true;
    const modes = new Set(mod.modResults.UIBackgroundModes ?? []);
    modes.add("audio");
    mod.modResults.UIBackgroundModes = [...modes];
    return mod;
  });
};
