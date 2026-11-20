import { describe, expect, it } from "@jest/globals";
import { metaInfoPlist } from "./with-meta-install";

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

  it("fails a production build that has no client token", () => {
    expect(() => metaInfoPlist({ EAS_BUILD_PROFILE: "production" })).toThrow("META_CLIENT_TOKEN");
    expect(
      metaInfoPlist({ EAS_BUILD_PROFILE: "production", META_CLIENT_TOKEN: "token" })
    ).toMatchObject({
      FacebookClientToken: "token",
    });
  });
});
