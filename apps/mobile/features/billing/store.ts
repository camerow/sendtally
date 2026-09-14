import { t, type MessageKey } from "@sendtally/features/i18n";
import { Platform } from "react-native";
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";
import { REVENUECAT_API_KEY } from "../../lib/config";

export const storeBillingAvailable = REVENUECAT_API_KEY !== "";

export function storeLabel(): string {
  return Platform.OS === "ios" ? t("mobile.billing.appStore") : t("mobile.billing.googlePlay");
}

const MANAGE_URL =
  Platform.OS === "ios"
    ? "https://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions";

let configuredFor: string | null = null;

export async function signInToStore(userId: string): Promise<void> {
  if (!storeBillingAvailable) return;
  if (configuredFor === null) {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
  } else if (configuredFor !== userId) {
    await Purchases.logIn(userId);
  }
  configuredFor = userId;
}

export async function loadPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export type PurchaseOutcome = "purchased" | "cancelled";

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchasePackage(pkg);
    return "purchased";
  } catch (err) {
    if (isCancellation(err)) return "cancelled";
    throw err;
  }
}

export async function restorePurchases(): Promise<void> {
  await Purchases.restorePurchases();
}

export async function subscriptionManagementUrl(): Promise<string> {
  if (!storeBillingAvailable) return MANAGE_URL;
  const info = await Purchases.getCustomerInfo().catch(() => null);
  return info?.managementURL ?? MANAGE_URL;
}

function isCancellation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as PurchasesError).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

const PERIOD_KEYS: Partial<Record<PACKAGE_TYPE, MessageKey>> = {
  [PACKAGE_TYPE.WEEKLY]: "mobile.billing.period.week",
  [PACKAGE_TYPE.MONTHLY]: "mobile.billing.period.month",
  [PACKAGE_TYPE.TWO_MONTH]: "mobile.billing.period.twoMonths",
  [PACKAGE_TYPE.THREE_MONTH]: "mobile.billing.period.threeMonths",
  [PACKAGE_TYPE.SIX_MONTH]: "mobile.billing.period.sixMonths",
  [PACKAGE_TYPE.ANNUAL]: "mobile.billing.period.year",
};

function periodLabel(type: PACKAGE_TYPE): string | undefined {
  const key = PERIOD_KEYS[type];
  return key === undefined ? undefined : t(key);
}

export function packageLabel(pkg: PurchasesPackage): string {
  const { priceString } = pkg.product;
  const period = periodLabel(pkg.packageType);
  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) {
    return t("mobile.billing.priceOnce", { price: priceString });
  }
  return period === undefined
    ? priceString
    : t("mobile.billing.pricePerPeriod", { price: priceString, period });
}

const PLAN_KEYS: Partial<Record<PACKAGE_TYPE, MessageKey>> = {
  [PACKAGE_TYPE.WEEKLY]: "mobile.billing.plan.weekly",
  [PACKAGE_TYPE.MONTHLY]: "mobile.billing.plan.monthly",
  [PACKAGE_TYPE.TWO_MONTH]: "mobile.billing.plan.twoMonths",
  [PACKAGE_TYPE.THREE_MONTH]: "mobile.billing.plan.threeMonths",
  [PACKAGE_TYPE.SIX_MONTH]: "mobile.billing.plan.sixMonths",
  [PACKAGE_TYPE.ANNUAL]: "mobile.billing.plan.yearly",
  [PACKAGE_TYPE.LIFETIME]: "mobile.billing.plan.lifetime",
};

export type PlanCard = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  equivalent: string | null;
  bestValue: boolean;
};

export function planCardOf(pkg: PurchasesPackage): PlanCard {
  const { priceString, pricePerMonthString } = pkg.product;
  const period = periodLabel(pkg.packageType);
  const planKey = PLAN_KEYS[pkg.packageType];
  const base = {
    id: pkg.identifier,
    name: planKey === undefined ? pkg.product.title : t(planKey),
    bestValue: false,
  };
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL && pricePerMonthString !== null) {
    return {
      ...base,
      price: pricePerMonthString,
      cadence: t("mobile.billing.perMonth"),
      equivalent: t("mobile.billing.billedYearly", { price: priceString }),
      bestValue: true,
    };
  }
  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) {
    return {
      ...base,
      price: priceString,
      cadence: t("mobile.billing.onePayment"),
      equivalent: null,
    };
  }
  return {
    ...base,
    price: priceString,
    cadence: period === undefined ? "" : t("mobile.billing.perPeriod", { period }),
    equivalent: null,
  };
}

export function defaultPackage(packages: PurchasesPackage[]): PurchasesPackage | null {
  return packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? packages[0] ?? null;
}
