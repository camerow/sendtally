import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import type * as T_exercises from "@sendtally/features/exercises";
import type { Wizard } from "@sendtally/features/settings";
import type * as T_statistics from "@sendtally/features/statistics";
import type * as T_workouts from "@sendtally/features/workouts";
import { draftOf, withEditorIds } from "@sendtally/features/workouts";
import { ToastProvider } from "../../../components/Toast";
import { WithHang } from "../../../training/data/testHang";
import { WorkoutBuilder } from "./WorkoutBuilder";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const zercher: Exercise = {
  id: "z",
  name: "Zercher squat",
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  description: "",
  archived: false,
};

const unnamed: LibraryWorkout = {
  id: "w1",
  kind: "strength",
  name: "",
  description: "",
  minutes: 30,
  targetRpe: null,
  items: [{ exercise: "Zercher squat", doses: [{ sets: 3, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  source: "mine",
};

const writes = vi.hoisted(() => ({ saveWorkout: vi.fn(async () => undefined) }));

vi.mock("../../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => writes,
}));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof T_exercises>()),
  usePickerWorld: (_api: unknown, _model: unknown, inWorkout: string[], offer: string) => ({
    mine: [zercher],
    grips: [],
    uses: new Map(),
    inWorkout,
    offer,
  }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [zercher] }, reload: vi.fn() }),
}));

const wizard = {
  path: "plan",
  step: "P2",
  canGoBack: true,
  position: { n: 2, total: 7 },
  memory: { way: "by_hand", existingLog: "none", days: [], membershipShown: false },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  setDays: vi.fn(),
  next: vi.fn(),
  back: vi.fn(),
  skip: vi.fn(),
  leave: vi.fn(),
  complete: vi.fn(),
  capture: vi.fn(),
} satisfies Wizard;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("P2's name", () => {
  it("starts as the first exercise's kind, so Continue is on with an exercise and no typed name", () => {
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <ToastProvider>
            <MemoryRouter>
              <WithHang>
                <WorkoutBuilder
                  wizard={wizard}
                  api={{} as SendtallyApi}
                  id="w1"
                  initial={withEditorIds(draftOf(unnamed), () => "i1")}
                />
              </WithHang>
            </MemoryRouter>
          </ToastProvider>
        </QueryClientProvider>
      )
    );
    const field = host.querySelector<HTMLTextAreaElement>('textarea[aria-label="Workout name"]');
    expect(field?.value).toBe("Strength workout");
    const next = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.startsWith("Continue")
    );
    expect(next?.disabled).toBe(false);
    act(() => next?.click());
    expect(writes.saveWorkout).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({ name: "Strength workout" })
    );
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
