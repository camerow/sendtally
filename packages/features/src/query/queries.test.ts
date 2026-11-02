import { describe, expect, it } from "vitest";
import { worthPersisting } from "./queries";

describe("worthPersisting", () => {
  it("keeps the user's own data, membership included, for an offline launch", () => {
    for (const key of ["sessions", "session", "entry", "hang", "plan", "entitlements"]) {
      expect(worthPersisting([key])).toBe(true);
    }
  });

  it("leaves shared area lookups and moderation online-only", () => {
    for (const key of ["area", "areaClimb", "areaSearch", "areaClimbSearch", "moderation"]) {
      expect(worthPersisting([key])).toBe(false);
    }
  });
});
