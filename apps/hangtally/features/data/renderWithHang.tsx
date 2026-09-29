import { jest } from "@jest/globals";
import { render, type RenderResult } from "@testing-library/react-native";
import React from "react";
import type { HangData as ApiHangData } from "@sendtally/api-client";
import { hangModel, type HangActions } from "@sendtally/features/hang";
import { ThemeProvider } from "../../theme/ThemeContext";
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
      theme: "moss",
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
    saveWorkout: jest.fn(done),
    setDefaultGrip: jest.fn(done),
    setLoads: jest.fn(done),
    saveSchedules: jest.fn(done),
    deleteSchedule: jest.fn(done),
    saveSession: jest.fn(done),
    deleteSession: jest.fn(done),
    saveSettings: jest.fn(done),
  };
}

/** Renders a screen over fixed training data, with actions a test can inspect. */
export async function renderWithHang(
  ui: React.ReactElement,
  data: ApiHangData = hangData(),
  actions: MockActions = mockActions()
): Promise<RenderResult & { actions: MockActions }> {
  const value = { model: hangModel(data), actions, today: TODAY };
  const result = await render(
    <ThemeProvider name={data.settings.theme}>
      <HangDataContext.Provider value={value}>{ui}</HangDataContext.Provider>
    </ThemeProvider>
  );
  return { ...result, actions };
}
