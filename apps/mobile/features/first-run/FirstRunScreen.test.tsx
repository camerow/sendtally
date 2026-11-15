import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirstRunScreen } from "./FirstRunScreen";

const show = (): Promise<unknown> =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FirstRunScreen />
    </QueryClientProvider>
  );

const mockSave = jest.fn(async () => undefined);
const mockStep = jest.fn(async () => undefined);
const mockApi = { firstRunStep: mockStep };
const mockPrompt = jest.fn();

jest.mock("expo-crypto", () => ({ randomUUID: () => "m-new" }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../training/data/useToday", () => ({ useToday: () => "2026-11-15" }));
jest.mock("../training/plan/usePlanActions", () => ({
  usePlanActions: () => ({ saveMembership: mockSave }),
}));
jest.mock("../training/reminders/ReminderPromptProvider", () => ({
  useReminderPrompt: () => mockPrompt,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("first run", () => {
  it("imports from the picked source, coming back here", async () => {
    await show();
    await fireEvent.press(screen.getByText("Mountain Project"));
    await fireEvent.press(screen.getByText("Import from Mountain Project"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/import",
      params: { then: "/first-run", from: "mountainProject" },
    });
    expect(mockStep.mock.calls).toEqual([
      [{ step: "started" }],
      [{ step: "log_answered", existingLog: "mountainProject" }],
    ]);
  });

  it("saves the climbing days as one Ongoing Climbing week, then asks about reminders", async () => {
    await show();
    await fireEvent.press(screen.getByText("No, this is my first"));
    await fireEvent.press(screen.getByText("Continue"));
    expect(screen.getByText("Which days do you usually climb?")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Tuesday"));
    await fireEvent.press(screen.getByLabelText("Saturday"));
    await fireEvent.press(screen.getByText("Continue"));
    expect(mockSave).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "climb-session",
      blockId: null,
      weekdays: [1, 5],
      start: "2026-11-15",
      position: 0,
    });
    expect(mockPrompt).toHaveBeenCalled();
    expect(mockStep).toHaveBeenCalledWith({
      step: "finished",
      climbingDays: 2,
      endedAt: "plan",
    });
    expect(router.replace).toHaveBeenCalledWith({ pathname: "/(tabs)/today", params: {} });
  });

  it("saves nothing and never asks with no day picked", async () => {
    await show();
    await fireEvent.press(screen.getByText("Later"));
    await fireEvent.press(screen.getByText("Continue"));
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockPrompt).not.toHaveBeenCalled();
    expect(mockStep).toHaveBeenCalledWith({
      step: "finished",
      climbingDays: 0,
      endedAt: "plan",
    });
  });

  it("skips to an empty Log from the first question", async () => {
    await show();
    await fireEvent.press(screen.getByText("Skip"));
    expect(mockStep).toHaveBeenCalledWith({
      step: "finished",
      climbingDays: 0,
      endedAt: "skip_log",
    });
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/sessions");
    expect(mockStep.mock.calls).toEqual([
      [{ step: "started" }],
      [expect.objectContaining({ step: "finished" })],
    ]);
  });
});
