import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import { membersGet } from "@sendtally/features/billing";
import { MembershipView } from "./MembershipView";
import { billingFeature, ENTITLEMENTS } from "./testBilling";
import type { PurchaseFeature } from "./usePurchase";

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {},
  PACKAGE_TYPE: { MONTHLY: "MONTHLY", ANNUAL: "ANNUAL", LIFETIME: "LIFETIME" },
  PURCHASES_ERROR_CODE: {},
}));

const purchase: PurchaseFeature = {
  status: "ready",
  packages: [],
  error: null,
  purchase: jest.fn(),
  restore: jest.fn(),
};

const show = (entitlements: Entitlements): Promise<unknown> =>
  render(
    <MembershipView
      membership={billingFeature(entitlements)}
      members={membersGet(entitlements, { workouts: 5, blocks: 2, exercises: 0 }, "kg")}
      purchase={purchase}
      onBack={jest.fn()}
    />
  );

describe("MembershipView", () => {
  it("shows a free account in its trial what members get and when it needs them", async () => {
    await show(ENTITLEMENTS.trial);
    expect(screen.getByText(/are free, and always will be\.$/)).toBeTruthy();
    expect(screen.getByText("Members get…")).toBeTruthy();
    expect(screen.getByText(/^After .* these need a membership\.$/)).toBeTruthy();
    expect(screen.queryByText("Want to support this app?")).toBeNull();
    expect(screen.queryByText("Your training is open.")).toBeNull();
  });

  it("tells a free account past its trial what it made is locked, not deleted", async () => {
    await show(ENTITLEMENTS.pastTrial);
    expect(screen.getByText("Your 5 workouts and 2 blocks are locked, not deleted.")).toBeTruthy();
  });

  it("keeps a member's gold panel and leaves out Members get", async () => {
    await show(ENTITLEMENTS.member);
    expect(screen.getByText("Your training is open.")).toBeTruthy();
    expect(screen.queryByText("Members get…")).toBeNull();
  });
});
