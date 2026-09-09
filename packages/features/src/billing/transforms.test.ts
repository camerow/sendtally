import { describe, expect, it } from "vitest";
import { formatRenewalDate, managedInOf, membershipVM, storeName } from "./transforms";

const FUTURE = "2099-01-01T00:00:00Z";

describe("membershipVM", () => {
  it("is not a member while nothing has loaded", () => {
    expect(membershipVM(null)).toEqual({
      active: false,
      statusLabel: "NOT A MEMBER",
      managedIn: null,
      renewalLine: null,
    });
  });

  it("is not a member when the membership is inactive", () => {
    expect(membershipVM({ membership: { active: false, web: false, store: null } }).active).toBe(
      false
    );
  });

  it("reads a Google Play subscription as renewing on its expiry date", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: false,
        store: { store: "play_store", expiresAt: FUTURE, willRenew: true },
      },
    });
    expect(vm).toEqual({
      active: true,
      statusLabel: "MEMBER · GOOGLE PLAY",
      managedIn: "play_store",
      renewalLine: `Renews ${formatRenewalDate(FUTURE)}`,
    });
  });

  it("says when a cancelled store subscription ends", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: false,
        store: { store: "app_store", expiresAt: FUTURE, willRenew: false },
      },
    });
    expect(vm.statusLabel).toBe("MEMBER · APP STORE");
    expect(vm.renewalLine).toBe(`Ends ${formatRenewalDate(FUTURE)}`);
  });

  it("calls a null expiry a lifetime membership", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: false,
        store: { store: "promotional", expiresAt: null, willRenew: false },
      },
    });
    expect(vm.managedIn).toBe("other");
    expect(vm.renewalLine).toBe("Lifetime");
  });

  it("prefers the store subscription when both are active", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: true,
        store: { store: "play_store", expiresAt: FUTURE, willRenew: true },
      },
    });
    expect(vm.managedIn).toBe("play_store");
  });

  it("reads a web-only membership as managed on the web", () => {
    expect(membershipVM({ membership: { active: true, web: true, store: null } })).toEqual({
      active: true,
      statusLabel: "MEMBER · WEB",
      managedIn: "web",
      renewalLine: null,
    });
  });
});

describe("store names", () => {
  it("maps store identifiers to where the user manages the subscription", () => {
    expect(storeName(managedInOf("play_store"))).toBe("Google Play");
    expect(storeName(managedInOf("app_store"))).toBe("the App Store");
    expect(storeName(managedInOf("stripe"))).toBe("your store");
    expect(storeName("web")).toBe("sendtally.com");
  });
});
