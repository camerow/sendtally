import { describe, expect, it } from "@jest/globals";
import { metaAndroid, metaInfoPlist } from "./with-meta-install";

describe("metaInfoPlist", () => {
  it("leaves the client token out when the build has none, so the SDK never starts", () => {
    expect(metaInfoPlist({})).toEqual({
      FacebookAppID: "1795052648219979",
      FacebookDisplayName: "Sendtally",
      FacebookAutoLogAppEventsEnabled: true,
      FacebookAdvertiserIDCollectionEnabled: false,
    });
  });

  it("writes the client token when the build has one", () => {
    expect(metaInfoPlist({ META_CLIENT_TOKEN: "token" }).FacebookClientToken).toBe("token");
  });

  it("gives Android the same settings, and its client token only when the build has one", () => {
    expect(metaAndroid({})).toEqual({
      strings: { facebook_app_id: "1795052648219979" },
      metaData: {
        "com.facebook.sdk.ApplicationId": "@string/facebook_app_id",
        "com.facebook.sdk.AutoLogAppEventsEnabled": "true",
        "com.facebook.sdk.AdvertiserIDCollectionEnabled": "false",
      },
    });
    const withToken = metaAndroid({ META_CLIENT_TOKEN: "token" });
    expect(withToken.strings.facebook_client_token).toBe("token");
    expect(withToken.metaData["com.facebook.sdk.ClientToken"]).toBe(
      "@string/facebook_client_token"
    );
    expect(() => metaAndroid({ EAS_BUILD_PROFILE: "production" })).toThrow("META_CLIENT_TOKEN");
  });

  it("fails a production build that has no client token", () => {
    expect(() => metaInfoPlist({ EAS_BUILD_PROFILE: "production" })).toThrow("META_CLIENT_TOKEN");
    expect(
      metaInfoPlist({ EAS_BUILD_PROFILE: "production", META_CLIENT_TOKEN: "token" })
    ).toMatchObject({
      FacebookClientToken: "token",
    });
  });
});
