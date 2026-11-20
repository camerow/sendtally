import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { Wizard } from "@sendtally/features/settings";
import { ChooserStep } from "./ChooserStep";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const wizard: Wizard = {
  path: null,
  step: "choose",
  canGoBack: false,
  position: { n: 0, total: 0 },
  memory: { way: null, existingLog: null, days: [], membershipShown: false },
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
};

const show = (): Promise<unknown> => render(<ChooserStep wizard={wizard} />);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("chooser", () => {
  it("shows both paths and Skip", async () => {
    await show();
    expect(screen.getByText("Bring in my climbing")).toBeTruthy();
    expect(screen.getByText("Build my training plan")).toBeTruthy();
    await fireEvent.press(screen.getByText("Skip"));
    expect(wizard.skip).toHaveBeenCalled();
  });

  it("starts the pressed path from the chooser", async () => {
    await show();
    await fireEvent.press(screen.getByText("Bring in my climbing"));
    expect(wizard.choose).toHaveBeenCalledWith("history", "chooser");
    await fireEvent.press(screen.getByText("Build my training plan"));
    expect(wizard.choose).toHaveBeenCalledWith("plan", "chooser");
  });
});
