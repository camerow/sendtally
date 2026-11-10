import type { Entitlements } from "@sendtally/api-client";
import { describe, expect, it } from "vitest";
import { hasAccess, trialDaysLeft } from "./access";

const NOW = new Date("2027-03-10T12:00:00.000Z");
const MEMBER = { active: true, web: true, store: null };

const free = (endsAt: string): Entitlements => ({
  membership: { active: false, web: false, store: null },
  trial: { endsAt },
});

describe("hasAccess", () => {
  it("is closed while nothing has loaded", () => {
    expect(hasAccess(null, NOW)).toBe(false);
  });

  it("is open while the trial runs and closed from the moment it ends", () => {
    expect(hasAccess(free("2027-03-10T12:00:00.001Z"), NOW)).toBe(true);
    expect(hasAccess(free(NOW.toISOString()), NOW)).toBe(false);
  });

  it("is open for a member after the trial", () => {
    expect(hasAccess({ ...free("2001-01-01T00:00:00Z"), membership: MEMBER }, NOW)).toBe(true);
  });

  it("is closed for a cached store membership whose paid period has since ended", () => {
    const lapsed: Entitlements = {
      membership: {
        active: true,
        web: false,
        store: {
          store: "play_store",
          productId: "membership:monthly",
          expiresAt: "2027-03-01T00:00:00Z",
          willRenew: false,
        },
      },
      trial: { endsAt: "2001-01-01T00:00:00Z" },
    };
    expect(hasAccess(lapsed, NOW)).toBe(false);
  });
});

describe("trialDaysLeft", () => {
  it("counts a part day as a day", () => {
    expect(trialDaysLeft(free("2027-04-09T12:00:00.000Z"), NOW)).toBe(30);
    expect(trialDaysLeft(free("2027-03-10T13:00:00.000Z"), NOW)).toBe(1);
  });

  it("is null once the trial is over or for a member", () => {
    expect(trialDaysLeft(free("2027-03-01T00:00:00Z"), NOW)).toBeNull();
    expect(
      trialDaysLeft({ ...free("2027-04-09T12:00:00.000Z"), membership: MEMBER }, NOW)
    ).toBeNull();
  });
});
