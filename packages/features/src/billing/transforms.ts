import type { Entitlements, StoreMembership } from "@sendtally/api-client";
import type { MembershipManagedIn, MembershipVM } from "./types";

const STORE_NAMES: Record<MembershipManagedIn, string> = {
  web: "sendtally.com",
  play_store: "Google Play",
  app_store: "the App Store",
  other: "your store",
};

export function managedInOf(store: string): MembershipManagedIn {
  return store === "play_store" || store === "app_store" ? store : "other";
}

export function storeName(managedIn: MembershipManagedIn): string {
  return STORE_NAMES[managedIn];
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
    return { active: false, statusLabel: "NOT A MEMBER", managedIn: null, renewalLine: null };
  }
  if (membership.store !== null) {
    const managedIn = managedInOf(membership.store.store);
    return {
      active: true,
      statusLabel: `MEMBER · ${storeName(managedIn).replace("the ", "").toUpperCase()}`,
      managedIn,
      renewalLine: renewalLine(membership.store),
    };
  }
  return { active: true, statusLabel: "MEMBER · WEB", managedIn: "web", renewalLine: null };
}
