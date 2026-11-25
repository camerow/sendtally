import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { Entitlements } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { apiWith, ENTITLEMENTS, withBilling } from "../../billing/testBilling";
import { renderWithHang } from "../../training/data/renderWithHang";
import { DoneStep } from "./DoneStep";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href), replace: jest.fn() },
}));
const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
);
jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));

const wizard = {
  path: "plan",
  step: "P7",
  canGoBack: false,
  position: { n: 7, total: 7 },
  memory: { way: "by_hand", existingLog: "none" },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  open: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

const show = (entitlements: Entitlements): Promise<unknown> =>
  renderWithHang(
    withBilling(<DoneStep wizard={wizard} api={apiWith(entitlements)} />, entitlements)
  );

describe("P7", () => {
  it("explains the trial and what members get, with no price and no x", async () => {
    await show(ENTITLEMENTS.trial);
    expect(await screen.findByText("14 days free.")).toBeTruthy();
    expect(screen.getByText("Always free")).toBeTruthy();
    expect(screen.getByText(/these need a membership\.$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.queryByText(/\$|per year|per month/)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Become a member" }));
    expect(mockPush).toHaveBeenCalledWith("/membership?source=onboarding");
  });

  it("drops the trial panel once the trial is over", async () => {
    await show(ENTITLEMENTS.pastTrial);
    expect(await screen.findByText("These need a membership.")).toBeTruthy();
    expect(screen.queryByText("14 days free.")).toBeNull();
  });

  it("shows a member the week and Done, which lands on the plan", async () => {
    wizard.complete.mockClear();
    await show(ENTITLEMENTS.member);
    expect(screen.getByText("Your week")).toBeTruthy();
    expect(screen.queryByText("Members get…")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(wizard.complete).toHaveBeenCalledWith("member", "plan");
  });
});
