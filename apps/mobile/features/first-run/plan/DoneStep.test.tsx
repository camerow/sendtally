import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { renderWithHang } from "../../training/data/renderWithHang";
import { DoneStep } from "./DoneStep";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));

const wizard = {
  path: "plan",
  step: "P7",
  canGoBack: false,
  position: { n: 7, total: 7 },
  memory: { way: "by_hand", existingLog: "none", days: [], membershipShown: false },
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

describe("P7", () => {
  it("closes to the plan, as Open my plan does", async () => {
    await renderWithHang(<DoneStep wizard={wizard} api={mockApi} />);
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(wizard.complete).toHaveBeenCalledTimes(1);
    expect(wizard.complete).toHaveBeenCalledWith("later", "plan");
  });
});
