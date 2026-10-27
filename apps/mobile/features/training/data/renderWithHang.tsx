import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import React from "react";
import type {
  ActivityRecord,
  Exercise,
  HangData as ApiHangData,
  Plan,
  WorkoutRecord,
} from "@sendtally/api-client";
import { hangModel, type HangActions } from "@sendtally/features/hang";
import { libraryOf } from "@sendtally/features/workouts";
import { HangDataContext } from "./HangDataContext";

export const TODAY = "2026-09-29";

export function hangData(overrides: Partial<ApiHangData> = {}): ApiHangData {
  return {
    grips: [],
    defaultGrips: {},
    loads: {},
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
    setDefaultGrip: jest.fn(done),
    saveSession: jest.fn(done),
    deleteSession: jest.fn(done),
    saveSettings: jest.fn(done),
  };
}

export type HangWorld = {
  actions?: MockActions;
  /** The user's own workouts. */
  workouts?: readonly WorkoutRecord[];
  plan?: Plan;
  exercises?: readonly Exercise[];
  activities?: readonly ActivityRecord[];
};

/**
 * Renders a screen over fixed training data, the user's own workouts and their plan,
 * with actions a test can inspect. The cache holds them so nothing is fetched; other
 * reads find nothing.
 */
export async function renderWithHang(
  ui: React.ReactElement,
  data: ApiHangData = hangData(),
  world: HangWorld = {}
): Promise<RenderResult & { actions: MockActions }> {
  const actions = world.actions ?? mockActions();
  const workouts = world.workouts ?? [];
  const value = { model: hangModel(data, libraryOf(workouts)), actions, today: TODAY };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  });
  client.setQueryData(["hang"], data);
  client.setQueryData(["workouts"], workouts);
  client.setQueryData(["plan"], world.plan ?? { blocks: [], memberships: [], weekChanges: [] });
  client.setQueryData(["activities"], world.activities ?? []);
  client.setQueryData(["exercises"], world.exercises ?? []);
  client.setQueryData(["sessions"], { sessions: [], hangSessions: [], activities: [] });
  const result = await render(
    <QueryClientProvider client={client}>
      <HangDataContext.Provider value={value}>{ui}</HangDataContext.Provider>
    </QueryClientProvider>
  );
  return { ...result, actions };
}
