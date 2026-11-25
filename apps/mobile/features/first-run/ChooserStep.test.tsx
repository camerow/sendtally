import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
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
  memory: { way: null, existingLog: null },
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
};

const progress = {
  sessions: true,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};

const api = {
  status: async () => ({ onboarding: { path: null, left: false, progress } }),
} as unknown as SendtallyApi;

const show = (): Promise<unknown> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ChooserStep wizard={wizard} api={api} />
    </QueryClientProvider>
  );
};

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

  it("marks a path the user has already done", async () => {
    await show();
    expect(await screen.findAllByText("Done")).toHaveLength(1);
  });
});
