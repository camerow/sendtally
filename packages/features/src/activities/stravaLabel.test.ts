import { describe, expect, it } from "vitest";
import { stravaLabel } from "./stravaLabel";

describe("stravaLabel", () => {
  it("names the Strava action each state offers", () => {
    expect(stravaLabel({ kind: "connect" })).toBe("Connect Strava");
    expect(stravaLabel({ kind: "posted", url: "u", postedAt: null })).toBe("View on Strava");
    expect(stravaLabel({ kind: "failed", reason: null })).toBe("Try posting again");
  });
});
