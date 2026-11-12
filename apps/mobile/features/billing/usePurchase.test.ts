import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import type { PurchasesPackage } from "react-native-purchases";
import type { Entitlements } from "@sendtally/api-client";
import { logConversion } from "../analytics/conversions";
import { purchasePackage } from "./store";
import { usePurchase } from "./usePurchase";

jest.mock("../analytics/conversions", () => ({ logConversion: jest.fn() }));
jest.mock("./store", () => ({
  storeBillingAvailable: true,
  storeLabel: () => "Google Play",
  loadPackages: () => Promise.resolve([]),
  purchasePackage: jest.fn(),
  restorePurchases: () => Promise.resolve(),
}));

const yearly = { product: { identifier: "membership:yearly" } } as unknown as PurchasesPackage;

function entitlements(active: boolean): Promise<Entitlements> {
  return Promise.resolve({ membership: { active } } as Entitlements);
}

async function buy(outcome: "purchased" | "cancelled", active: boolean): Promise<void> {
  jest.mocked(purchasePackage).mockResolvedValue(outcome);
  const { result } = await renderHook(() => usePurchase(() => entitlements(active)));
  await act(async () => result.current.purchase(yearly));
}

describe("usePurchase", () => {
  beforeEach(() => {
    jest.mocked(logConversion).mockClear();
  });

  it("logs membership_started once the Worker confirms the membership", async () => {
    await buy("purchased", true);
    expect(logConversion).toHaveBeenCalledWith("membership_started", {
      channel: "app_store",
      product_id: "membership:yearly",
    });
  });

  it("logs nothing for a cancelled purchase or one the Worker does not confirm", async () => {
    await buy("cancelled", true);
    await buy("purchased", false);
    expect(logConversion).not.toHaveBeenCalled();
  });
});
