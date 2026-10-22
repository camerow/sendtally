import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import React from "react";
import type { HangData as ApiHangData } from "@sendtally/api-client";
import { hangModel, type HangActions } from "@sendtally/features/hang";
import { HangDataContext } from "./HangDataContext";

export const TODAY = "2026-09-29";

export function hangData(overrides: Partial<ApiHangData> = {}): ApiHangData {
  return {
    grips: [],
    workouts: [],
    defaultGrips: {},
    loads: {},
    schedules: [],
    sessions: [],
    settings: {
      units: "kg",
      theme: "gunmetal",
      reminders: false,
      reminderTime: "08:00",
      postToStrava: false,
      reminderPromptSeen: true,
    },
    strava: { connected: false },
    ...overrides,
  };
}

export type MockActions = { [K in keyof HangActions]: jest.Mock<HangActions[K]> };

export function mockActions(): MockActions {
  const done = (): Promise<void> => Promise.resolve();
  return {
    saveGrip: jest.fn(done),
    deleteGrip: jest.fn(done),
    saveWorkout: jest.fn(done),
    deleteWorkout: jest.fn(done),
    setDefaultGrip: jest.fn(done),
    saveSchedules: jest.fn(done),
    deleteSchedule: jest.fn(done),
    saveSession: jest.fn(done),
    deleteSession: jest.fn(done),
    saveSettings: jest.fn(done),
  };
}

/** Renders a screen over fixed training data, with actions a test can inspect. Other reads find nothing. */
export async function renderWithHang(
  ui: React.ReactElement,
  data: ApiHangData = hangData(),
  actions: MockActions = mockActions()
): Promise<RenderResult & { actions: MockActions }> {
  const value = { model: hangModel(data), actions, today: TODAY };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const result = await render(
    <QueryClientProvider client={client}>
      <HangDataContext.Provider value={value}>{ui}</HangDataContext.Provider>
    </QueryClientProvider>
  );
  return { ...result, actions };
}
