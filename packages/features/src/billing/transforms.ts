import type { Entitlements, StoreMembership } from "@sendtally/api-client";
import type { MembershipManagedIn, MembershipPlan, MembershipVM } from "./types";

const STORE_NAMES: Record<MembershipManagedIn, string> = {
  web: "sendtally.com",
  play_store: "Google Play",
  app_store: "the App Store",
  test_store: "the test store",
  other: "your store",
};

export function managedInOf(store: string): MembershipManagedIn {
  const id = store.toLowerCase();
  if (id === "play_store" || id === "app_store") return id;
  if (id.includes("test_store")) return "test_store";
  return "other";
}

export function storeName(managedIn: MembershipManagedIn): string {
  return STORE_NAMES[managedIn];
}

const PLAN_LABELS: Record<MembershipPlan, string> = {
  monthly: "Monthly plan",
  yearly: "Yearly plan",
};

export function planOf(productId: string | undefined): MembershipPlan | null {
  const id = productId?.toLowerCase() ?? "";
  if (id.includes("year") || id.includes("annual")) return "yearly";
  if (id.includes("month")) return "monthly";
  return null;
}

export function planLabel(plan: MembershipPlan): string {
  return PLAN_LABELS[plan];
}

export function formatRenewalDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renewalLine(store: StoreMembership): string {
  if (store.expiresAt === null) return "Lifetime";
  const date = formatRenewalDate(store.expiresAt);
  return store.willRenew ? `Renews ${date}` : `Ends ${date}`;
}

export function membershipVM(entitlements: Entitlements | null): MembershipVM {
  const membership = entitlements?.membership ?? null;
  if (membership === null || !membership.active) {
    return {
      active: false,
      statusLabel: "NOT A MEMBER",
      managedIn: null,
      plan: null,
      renewalLine: null,
    };
  }
  if (membership.store !== null) {
    const managedIn = managedInOf(membership.store.store);
    return {
      active: true,
      statusLabel: `MEMBER · ${storeName(managedIn).replace("the ", "").toUpperCase()}`,
      managedIn,
      plan: planOf(membership.store.productId),
      renewalLine: renewalLine(membership.store),
    };
  }
  return {
    active: true,
    statusLabel: "MEMBER · WEB",
    managedIn: "web",
    plan: null,
    renewalLine: null,
  };
}
