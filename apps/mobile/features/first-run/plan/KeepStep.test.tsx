import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import React from "react";
import type { Text } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { renderWithHang } from "../../training/data/renderWithHang";
import { KeepStep } from "./KeepStep";

const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));

const mockEndsAt = new Date(2099, 3, 9, 12).toISOString();

jest.mock("../../billing/useBilling", () => ({
  useBilling: () => ({
    membership: {
      active: false,
      state: {
        status: "ready",
        data: {
          membership: { active: false, web: false, store: null },
          trial: { endsAt: mockEndsAt },
        },
      },
    },
  }),
}));

jest.mock("../../billing/Paywall", () => ({
  Paywall: ({ eyebrow }: { eyebrow?: string }) => {
    const { Text: MockText } = jest.requireActual<{ Text: typeof Text }>("react-native");
    return <MockText>{eyebrow ?? "no eyebrow"}</MockText>;
  },
}));

const wizard = {
  path: "plan",
  step: "P6",
  canGoBack: true,
  position: { n: 6, total: 6 },
  memory: { way: null, existingLog: null, days: [], membershipShown: true },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  setDays: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

describe("P6", () => {
  it("tells a user inside the trial when it ends, as H5 does", async () => {
    await renderWithHang(<KeepStep wizard={wizard} api={mockApi} />);
    expect(screen.getByText("Free trial · ends Apr 9")).toBeTruthy();
  });
});
