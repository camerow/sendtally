import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import React from "react";
import type {
  ActivityRecord,
  ConnectionStatus,
  Exercise,
  HangData as ApiHangData,
  HangSessionRecord,
  Plan,
  SendtallyApi,
  WorkoutRecord,
} from "@sendtally/api-client";
import { defaultMeasure, type ExerciseKind } from "@sendtally/core/hang";
import { hangModel, type HangActions } from "@sendtally/features/hang";
import { queries } from "@sendtally/features/query";
import { libraryOf } from "@sendtally/features/workouts";
import { HangDataContext } from "./HangDataContext";

const EXERCISES_KEY = queries.exercises({} as SendtallyApi).queryKey;

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

/** One of the user's exercises, measured as its kind starts. */
export const anExercise = (
  id: string,
  name: string,
  kind: ExerciseKind,
  more: Partial<Exercise> = {}
): Exercise => ({
  id,
  name,
  kind,
  measure: defaultMeasure(kind),
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
  ...more,
});

/** A completed 6 × 10s max hang on a 20 mm half crimp, at bodyweight unless told. */
export const aHang = (over: Partial<HangSessionRecord> = {}): HangSessionRecord => ({
  id: `h-${over.gripId ?? "half"}-${over.date ?? "2026-09-20"}`,
  workoutId: "fingers-ab",
  gripId: "half",
  date: "2026-09-20",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  protocol: {
    name: "Max hangs",
    kind: "hang",
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 6,
    setRestS: 180,
  },
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "t",
  ...over,
});

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
  /** The account's connections; fetched, and so unknown at first, when left out. */
  status?: ConnectionStatus;
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
  client.setQueryData(EXERCISES_KEY, [...(world.exercises ?? [])]);
  client.setQueryData(["sessions"], {
    sessions: [],
    hangSessions: [],
    activities: world.activities ?? [],
  });
  if (world.status !== undefined) client.setQueryData(["status"], world.status);
  const result = await render(
    <QueryClientProvider client={client}>
      <HangDataContext.Provider value={value}>{ui}</HangDataContext.Provider>
    </QueryClientProvider>
  );
  return { ...result, actions };
}
