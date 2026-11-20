const { withInfoPlist } = require("expo/config-plugins");

function metaInfoPlist(env) {
  const clientToken = env.META_CLIENT_TOKEN;
  if (!clientToken && env.EAS_BUILD_PROFILE === "production") {
    throw new Error(
      "META_CLIENT_TOKEN is not set, so this store build would ship with the Meta SDK switched off. Add it to the EAS production environment."
    );
  }
  return {
    FacebookAppID: "1795052648219979",
    FacebookDisplayName: "Sendtally",
    FacebookAutoLogAppEventsEnabled: true,
    FacebookAdvertiserIDCollectionEnabled: false,
    ...(clientToken ? { FacebookClientToken: clientToken } : {}),
  };
}

module.exports = function withMetaInstall(config) {
  return withInfoPlist(config, (mod) => {
    Object.assign(mod.modResults, metaInfoPlist(process.env));
    return mod;
  });
};
module.exports.metaInfoPlist = metaInfoPlist;
