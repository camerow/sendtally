import type { Entitlements, StoreMembership } from "@sendtally/api-client";
import { formatDate, t, upper, type MessageKey } from "../i18n";
import type { MembershipManagedIn, MembershipPlan, MembershipVM } from "./types";

const STORE_NAMES: Record<MembershipManagedIn, MessageKey> = {
  web: "billing.storeWeb",
  play_store: "billing.storePlay",
  app_store: "billing.storeApp",
  test_store: "billing.storeTest",
  other: "billing.storeOther",
};

export function managedInOf(store: string): MembershipManagedIn {
  const id = store.toLowerCase();
  if (id === "play_store" || id === "app_store") return id;
  if (id.includes("test_store")) return "test_store";
  return "other";
}

export function storeName(managedIn: MembershipManagedIn): string {
  return t(STORE_NAMES[managedIn]);
}

const STORE_CHIPS: Record<MembershipManagedIn, MessageKey> = {
  web: "billing.storeChipWeb",
  play_store: "billing.storeChipPlay",
  app_store: "billing.storeChipApp",
  test_store: "billing.storeChipTest",
  other: "billing.storeChipOther",
};

export function storeChipName(managedIn: MembershipManagedIn): string {
  return t(STORE_CHIPS[managedIn]);
}

const PLAN_LABELS: Record<MembershipPlan, MessageKey> = {
  monthly: "billing.monthlyPlan",
  yearly: "billing.yearlyPlan",
};

export function planOf(productId: string | undefined): MembershipPlan | null {
  const id = productId?.toLowerCase() ?? "";
  if (id.includes("year") || id.includes("annual")) return "yearly";
  if (id.includes("month")) return "monthly";
  return null;
}

export function planLabel(plan: MembershipPlan): string {
  return t(PLAN_LABELS[plan]);
}

export function formatRenewalDate(iso: string): string {
  return formatDate(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
}

function renewalLine(store: StoreMembership): string {
  if (store.expiresAt === null) return t("billing.lifetime");
  const date = formatRenewalDate(store.expiresAt);
  return t(store.willRenew ? "billing.renews" : "billing.ends", { date });
}

export function membershipVM(entitlements: Entitlements | null): MembershipVM {
  const membership = entitlements?.membership ?? null;
  if (membership === null || !membership.active) {
    return {
      active: false,
      statusLabel: upper(t("billing.notAMember")),
      managedIn: null,
      plan: null,
      renewalLine: null,
    };
  }
  if (membership.store !== null) {
    const managedIn = managedInOf(membership.store.store);
    return {
      active: true,
      statusLabel: upper(t("billing.memberVia", { store: storeChipName(managedIn) })),
      managedIn,
      plan: planOf(membership.store.productId),
      renewalLine: renewalLine(membership.store),
    };
  }
  return {
    active: true,
    statusLabel: upper(t("billing.memberWeb")),
    managedIn: "web",
    plan: null,
    renewalLine: null,
  };
}
