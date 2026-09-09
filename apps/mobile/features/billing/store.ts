import { Platform } from "react-native";
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";
import { REVENUECAT_API_KEY } from "../../lib/config";

export const storeBillingAvailable = REVENUECAT_API_KEY !== "";

export const STORE_NAME = Platform.OS === "ios" ? "the App Store" : "Google Play";

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

const PERIOD_LABELS: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.WEEKLY]: "week",
  [PACKAGE_TYPE.MONTHLY]: "month",
  [PACKAGE_TYPE.TWO_MONTH]: "2 months",
  [PACKAGE_TYPE.THREE_MONTH]: "3 months",
  [PACKAGE_TYPE.SIX_MONTH]: "6 months",
  [PACKAGE_TYPE.ANNUAL]: "year",
};

export function packageLabel(pkg: PurchasesPackage): string {
  const period = PERIOD_LABELS[pkg.packageType];
  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) return `${pkg.product.priceString} once`;
  return period === undefined ? pkg.product.priceString : `${pkg.product.priceString} / ${period}`;
}
