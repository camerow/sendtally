import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { PACKAGE_TYPE, type PurchasesPackage } from "react-native-purchases";
import { PlanPicker } from "./PlanPicker";

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {},
  PACKAGE_TYPE: { MONTHLY: "MONTHLY", ANNUAL: "ANNUAL", LIFETIME: "LIFETIME" },
  PURCHASES_ERROR_CODE: {},
}));

function pkg(
  packageType: PACKAGE_TYPE,
  priceString: string,
  pricePerMonthString: string | null
): PurchasesPackage {
  return {
    identifier: packageType,
    packageType,
    product: { title: packageType, priceString, pricePerMonthString },
  } as unknown as PurchasesPackage;
}

describe("PlanPicker", () => {
  it("leads the yearly card with the billed amount, not the monthly equivalent", async () => {
    const yearly = pkg(PACKAGE_TYPE.ANNUAL, "$23.99", "$2.00");
    await render(
      <PlanPicker packages={[yearly]} selected={yearly} disabled={false} onSelect={() => {}} />
    );

    const billed = screen.getByText("$23.99");
    const monthly = screen.getByText("Works out to $2.00 a month");
    const style = (node: typeof billed): { fontSize: number } =>
      Object.assign({}, ...[node.props.style].flat()) as { fontSize: number };

    expect(screen.getByText("per year")).toBeTruthy();
    expect(style(billed).fontSize).toBeGreaterThan(style(monthly).fontSize);
    expect(screen.queryByText("$2.00")).toBeNull();
  });
});
