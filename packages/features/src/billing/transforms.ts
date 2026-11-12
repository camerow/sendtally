import type { Entitlements, StoreMembership } from "@sendtally/api-client";
import { formatDate, t, type MessageKey } from "../i18n";
import type { MembershipManagedIn, MembershipPlan, MembershipVM } from "./types";

const STORE_NAMES: Record<MembershipManagedIn, () => string> = {
  web: () => "sendtally.com",
  play_store: () => "Google Play",
  app_store: () => t("billing.storeApp"),
  test_store: () => t("billing.storeTest"),
  other: () => t("billing.storeOther"),
};

export function managedInOf(store: string): MembershipManagedIn {
  const id = store.toLowerCase();
  if (id === "play_store" || id === "app_store") return id;
  if (id.includes("test_store")) return "test_store";
  return "other";
}

export function storeName(managedIn: MembershipManagedIn): string {
  return STORE_NAMES[managedIn]();
}

const STORE_CHIPS: Record<MembershipManagedIn, () => string> = {
  web: () => "sendtally.com",
  play_store: () => "Google Play",
  app_store: () => "App Store",
  test_store: () => t("billing.storeChipTest"),
  other: () => t("billing.storeChipOther"),
};

export function storeChipName(managedIn: MembershipManagedIn): string {
  return STORE_CHIPS[managedIn]();
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

/**
 * A store membership whose paid period ended since it was cached, as one restored offline may
 * have: the server would no longer call it active, so neither does the app.
 */
function lapsed(membership: Entitlements["membership"], now: Date): boolean {
  const expiresAt = membership.store?.expiresAt ?? null;
  return !membership.web && expiresAt !== null && Date.parse(expiresAt) <= now.getTime();
}

export function membershipVM(
  entitlements: Entitlements | null,
  now: Date = new Date()
): MembershipVM {
  const membership = entitlements?.membership ?? null;
  if (membership === null || !membership.active || lapsed(membership, now)) {
    return {
      active: false,
      statusLabel: t("billing.notAMember"),
      managedIn: null,
      plan: null,
      renewalLine: null,
    };
  }
  if (membership.store !== null) {
    const managedIn = managedInOf(membership.store.store);
    return {
      active: true,
      statusLabel: t("billing.memberVia", { store: storeChipName(managedIn) }),
      managedIn,
      plan: planOf(membership.store.productId),
      renewalLine: renewalLine(membership.store),
    };
  }
  return {
    active: true,
    statusLabel: t("billing.memberWeb"),
    managedIn: "web",
    plan: null,
    renewalLine: null,
  };
}

/** The one line under the membership status saying what it is and where it is billed. */
export function membershipSummary(vm: MembershipVM): string {
  if (!vm.active) return t("settings.membershipFree");
  if (vm.managedIn === "play_store" || vm.managedIn === "app_store") {
    const plan = vm.plan === null ? t("common.membership") : planLabel(vm.plan);
    return t("settings.membershipStore", { plan, store: storeName(vm.managedIn) });
  }
  if (vm.managedIn === "web") return t("settings.membershipWeb");
  return t("billing.activeOnAccount");
}
