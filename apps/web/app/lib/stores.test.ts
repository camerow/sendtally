import { describe, expect, it } from "vitest";
import { storePlatform } from "./stores";

describe("storePlatform", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15", "ios"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131.0 Mobile", "android"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", null],
    [null, null],
  ])("reads %s as %s", (userAgent, platform) => {
    expect(storePlatform(userAgent)).toBe(platform);
  });
});
