const {
  AndroidConfig,
  withAndroidManifest,
  withInfoPlist,
  withStringsXml,
} = require("expo/config-plugins");

const APP_ID = "1795052648219979";

function clientTokenOf(env) {
  if (!env.META_CLIENT_TOKEN && env.EAS_BUILD_PROFILE === "production") {
    throw new Error(
      "META_CLIENT_TOKEN is not set, so this store build would ship with the Meta SDK switched off. Add it to the EAS production environment."
    );
  }
  return env.META_CLIENT_TOKEN;
}

function metaInfoPlist(env) {
  const clientToken = clientTokenOf(env);
  return {
    FacebookAppID: APP_ID,
    FacebookDisplayName: "Sendtally",
    FacebookAutoLogAppEventsEnabled: true,
    FacebookAdvertiserIDCollectionEnabled: false,
    ...(clientToken ? { FacebookClientToken: clientToken } : {}),
  };
}

function metaAndroid(env) {
  const clientToken = clientTokenOf(env);
  return {
    strings: {
      facebook_app_id: APP_ID,
      ...(clientToken ? { facebook_client_token: clientToken } : {}),
    },
    metaData: {
      "com.facebook.sdk.ApplicationId": "@string/facebook_app_id",
      "com.facebook.sdk.AutoLogAppEventsEnabled": "true",
      "com.facebook.sdk.AdvertiserIDCollectionEnabled": "false",
      ...(clientToken ? { "com.facebook.sdk.ClientToken": "@string/facebook_client_token" } : {}),
    },
  };
}

module.exports = function withMetaInstall(config) {
  config = withInfoPlist(config, (mod) => {
    Object.assign(mod.modResults, metaInfoPlist(process.env));
    return mod;
  });
  config = withStringsXml(config, (mod) => {
    const items = Object.entries(metaAndroid(process.env).strings).map(([name, value]) =>
      AndroidConfig.Resources.buildResourceItem({ name, value, translatable: false })
    );
    mod.modResults = AndroidConfig.Strings.setStringItem(items, mod.modResults);
    return mod;
  });
  return withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    for (const [name, value] of Object.entries(metaAndroid(process.env).metaData)) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(application, name, value);
    }
    return mod;
  });
};
module.exports.metaInfoPlist = metaInfoPlist;
module.exports.metaAndroid = metaAndroid;
