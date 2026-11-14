import { describe, expect, it } from "vitest";
import {
  formatRenewalDate,
  managedInOf,
  membershipSummary,
  membershipVM,
  planOf,
  storeName,
} from "./transforms";
import type { MembershipVM } from "./types";

const FUTURE = "2099-01-01T00:00:00Z";

describe("membershipVM", () => {
  it("is not a member while nothing has loaded", () => {
    expect(membershipVM(null)).toEqual({
      active: false,
      statusLabel: "Not a member",
      managedIn: null,
      plan: null,
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
        store: {
          store: "play_store",
          productId: "membership:yearly",
          expiresAt: FUTURE,
          willRenew: true,
        },
      },
    });
    expect(vm).toEqual({
      active: true,
      statusLabel: "Member · Google Play",
      managedIn: "play_store",
      plan: "yearly",
      renewalLine: `Renews ${formatRenewalDate(FUTURE)}`,
    });
  });

  it("says when a cancelled store subscription ends", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: false,
        store: {
          store: "app_store",
          productId: "membership_monthly",
          expiresAt: FUTURE,
          willRenew: false,
        },
      },
    });
    expect(vm.statusLabel).toBe("Member · App Store");
    expect(vm.renewalLine).toBe(`Ends ${formatRenewalDate(FUTURE)}`);
  });

  it("calls a null expiry a lifetime membership", () => {
    const vm = membershipVM({
      membership: {
        active: true,
        web: false,
        store: {
          store: "promotional",
          productId: "rc_promo_lifetime",
          expiresAt: null,
          willRenew: false,
        },
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
        store: {
          store: "play_store",
          productId: "membership:monthly",
          expiresAt: FUTURE,
          willRenew: true,
        },
      },
    });
    expect(vm.managedIn).toBe("play_store");
  });

  it("calls a cached store membership lapsed once its paid period has ended", () => {
    const store = {
      store: "app_store",
      productId: "monthly",
      expiresAt: "2026-10-01T00:00:00Z",
      willRenew: true,
    };
    const cached = { membership: { active: true, web: false, store } };
    expect(membershipVM(cached, new Date("2026-09-30T00:00:00Z")).active).toBe(true);
    expect(membershipVM(cached, new Date("2026-10-02T00:00:00Z")).active).toBe(false);
    expect(
      membershipVM(
        { membership: { ...cached.membership, web: true } },
        new Date("2026-10-02T00:00:00Z")
      ).active
    ).toBe(true);
  });

  it("reads a web-only membership as managed on the web", () => {
    expect(membershipVM({ membership: { active: true, web: true, store: null } })).toEqual({
      active: true,
      statusLabel: "Member · web",
      managedIn: "web",
      plan: null,
      renewalLine: null,
    });
  });
});

describe("planOf", () => {
  it("reads the plan from a Play base plan id", () => {
    expect(planOf("membership:monthly")).toBe("monthly");
    expect(planOf("membership:yearly")).toBe("yearly");
  });

  it("reads the plan from an App Store product id", () => {
    expect(planOf("com.sendtally.membership.annual")).toBe("yearly");
    expect(planOf("sendtally_member_monthly")).toBe("monthly");
  });

  it("has no plan for a product it does not recognise", () => {
    expect(planOf("rc_promo_lifetime")).toBeNull();
  });

  it("survives a Worker that does not send the product id yet", () => {
    expect(planOf(undefined)).toBeNull();
  });
});

describe("store names", () => {
  it("maps store identifiers to where the user manages the subscription", () => {
    expect(storeName(managedInOf("play_store"))).toBe("Google Play");
    expect(storeName(managedInOf("app_store"))).toBe("the App Store");
    expect(storeName(managedInOf("stripe"))).toBe("your store");
    expect(managedInOf("test_store")).toBe("test_store");
    expect(managedInOf("RC_TEST_STORE")).toBe("test_store");
    expect(storeName("test_store")).toBe("the test store");
    expect(storeName("web")).toBe("sendtally.com");
  });
});

describe("membershipSummary", () => {
  const member = (vm: Partial<MembershipVM>): MembershipVM => ({
    active: true,
    statusLabel: "Member",
    managedIn: null,
    plan: null,
    renewalLine: null,
    ...vm,
  });

  it("pitches the trends to someone who is not a member", () => {
    expect(membershipSummary(member({ active: false }))).toBe(
      "Logging is free. Membership adds the trends."
    );
  });

  it("names the plan and the store a store membership is billed through", () => {
    expect(membershipSummary(member({ managedIn: "play_store", plan: "yearly" }))).toBe(
      "Yearly plan, billed through Google Play."
    );
    expect(membershipSummary(member({ managedIn: "app_store" }))).toBe(
      "Membership, billed through the App Store."
    );
  });

  it("says a web membership was bought on sendtally.com", () => {
    expect(membershipSummary(member({ managedIn: "web" }))).toBe(
      "Bought on sendtally.com. It unlocks the trends here too."
    );
  });

  it("falls back to the account for any other store", () => {
    expect(membershipSummary(member({ managedIn: "other" }))).toBe(
      "Your membership is active on this account."
    );
  });
});
