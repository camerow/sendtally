import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { SchedulePage } from "./SchedulePage";

import type * as T_training from "@sendtally/features/training";
import type * as T_useLibrary from "../library/useLibrary";
import type * as T_statistics from "@sendtally/features/statistics";
import type * as T_workouts from "@sendtally/features/workouts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const writes = vi.hoisted(() => ({
  saveMembership: vi.fn(async () => undefined),
  saveSchedule: vi.fn(async () => undefined),
  saveWorkout: vi.fn(async () => undefined),
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

const plan: Plan = {
  blocks: [
    { id: "b1", name: "Winter base", start: "2026-11-09", weeks: 4, focus: null, description: "" },
  ],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({
    state: {
      status: "ready",
      data: [
        {
          id: "e1",
          name: "Pull-ups",
          kind: "strength",
          measure: "reps",
          eachSide: false,
          progress: null,
          builtIn: null,
          archived: false,
          description: "",
        },
      ],
    },
  }),
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => ({ saveWorkout: writes.saveWorkout, deleteWorkout: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../editor/useMake", () => ({ useMake: () => vi.fn(), usePick: () => vi.fn() }));
vi.mock("../data/HangDataContext", () => ({ useHangData: () => ({ today: "2026-11-12" }) }));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "ready", data: plan } }),
  usePlanActions: () => writes,
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/schedule"]}>
        <ToastProvider>
          <Routes>
            <Route path="/schedule" element={<SchedulePage workoutId="legs" />} />
            <Route path="/app/plan" element={<p>plan</p>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const add = (): HTMLButtonElement => container.querySelector<HTMLButtonElement>(".detail-primary")!;

describe("SchedulePage", () => {
  it("adds the workout every week on the days picked, from the start day, then shows the plan", async () => {
    expect(add().disabled).toBe(true);
    expect(container.querySelector("input[type=radio]")).toBeNull();
    const chips = container.querySelectorAll<HTMLButtonElement>(".weekday-chip");
    act(() => chips[1]?.click());
    act(() => chips[4]?.click());
    expect(add().textContent).toBe("Add every Tue, Fri");
    await act(async () => add().click());
    expect(writes.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        workoutId: "legs",
        blockId: null,
        weekdays: [1, 4],
        start: "2026-11-12",
      })
    );
    expect(container.textContent).toBe("plan");
  });

  it("schedules an exercise, making its one-exercise workout only on Add", async () => {
    act(() =>
      root.render(
        <MemoryRouter initialEntries={["/schedule"]}>
          <ToastProvider>
            <Routes>
              <Route path="/schedule" element={<SchedulePage exerciseId="e1" />} />
              <Route path="/app/plan" element={<p>plan</p>} />
            </Routes>
          </ToastProvider>
        </MemoryRouter>
      )
    );
    expect(container.querySelector(".plan-label")?.textContent).toBe("Pull-ups");
    act(() => container.querySelectorAll<HTMLButtonElement>(".weekday-chip")[2]?.click());
    expect(writes.saveWorkout).not.toHaveBeenCalled();
    await act(async () => add().click());
    expect(writes.saveWorkout).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: "Pull-ups", kind: "strength" })
    );
    const [[id]] = writes.saveWorkout.mock.calls as unknown as [[string]];
    expect(writes.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({ workoutId: id, weekdays: [2] })
    );
  });
});
