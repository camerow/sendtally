// `version` is a marketing number, not a native change, so it stays out of the runtime version.
// A config file replaces the default sourceSkips, which is why the package.json skip is repeated.
// firebase.json is read by the native build, not the app config, so it is hashed by hand.
module.exports = {
  sourceSkips: ["ExpoConfigVersions", "PackageJsonAndroidAndIosScriptsIfNotContainRun"],
  extraSources: [{ type: "file", filePath: "firebase.json", reasons: ["firebase"] }],
};
