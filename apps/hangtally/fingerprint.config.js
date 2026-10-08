// `version` is a marketing number, not a native change, so it stays out of the runtime version.
// A config file replaces the default sourceSkips, which is why the package.json skip is repeated.
module.exports = {
  sourceSkips: ["ExpoConfigVersions", "PackageJsonAndroidAndIosScriptsIfNotContainRun"],
};
