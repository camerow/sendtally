// The fingerprint is the runtime version, so it should move when the native layer moves and
// at no other time. `version` is hashed by default, and `chore(mobile): release vX` bumps it
// on every release - which stranded the e2e APK from every branch that followed, and made a
// marketing version look like a native change.
//
// A config file replaces the default sourceSkips rather than adding to them, so the default
// (prebuild rewrites package.json's android/ios scripts) has to be repeated here.
module.exports = {
  sourceSkips: ["ExpoConfigVersions", "PackageJsonAndroidAndIosScriptsIfNotContainRun"],
};
