import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Exercise, Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangModel } from "@sendtally/features/hang";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { hangData } from "../data/testHang";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";

import type * as T_exercises from "@sendtally/features/exercises";
import type * as T_training from "@sendtally/features/training";
import type * as T_useLibrary from "../library/useLibrary";
import type * as T_workouts from "@sendtally/features/workouts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

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

const exercise = (id: string, name: string): Exercise => ({
  id,
  name,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
  description: "",
});

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: null, weeks: 4, focus: null, description: "" }],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [], start: "2026-11-12", position: 0 },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const state = vi.hoisted(() => ({
  add: vi.fn(() => "m-new"),
  saveWorkout: vi.fn(async () => undefined),
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

vi.mock("@sendtally/features/billing", () => ({ useMembership: () => ({ access: null }) }));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/usePlanActions", () => ({ usePlanActions: () => ({}) }));
vi.mock("../editor/useMake", () => ({ useMake: () => vi.fn() }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({ model: hangModel(hangData(), libraryOf([])), today: "2026-11-12" }),
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => ({ saveWorkout: state.saveWorkout }),
}));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof T_exercises>()),
  useExerciseList: () => [],
  usePickerWorld: () => ({
    mine: [exercise("e1", "Pull-ups"), exercise("e2", "Back squat")],
    grips: [],
    uses: new Map(),
    inWorkout: [],
    offer: "exercises",
  }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  useTrainingLog: () => ({ log: { plan } }),
  useAddTo: () => ({ add: state.add, undo: vi.fn(), plans: plan.memberships }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter>
        <ToastProvider>
          <AddWorkoutsSheet flow={{ date: null, blockId: "b1" }} onClose={vi.fn()} />
        </ToastProvider>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const sheet = (): HTMLElement => document.querySelector<HTMLElement>("dialog")!;
const byText = (text: string): HTMLElement =>
  Array.from(sheet().querySelectorAll<HTMLElement>("button, label")).find(
    (b) => b.textContent === text
  )!;

describe("AddWorkoutsSheet", () => {
  it("adds an exercise to the block as a workout of it alone", async () => {
    expect(sheet().querySelector(".sheet-title")?.textContent).toBe("Add to block");
    act(() => byText("Exercises").click());
    expect(sheet().textContent).toContain("Not in a workout yet");
    expect(sheet().querySelector('[aria-label="Add Back squat"]')).toBeNull();
    expect(sheet().querySelector(".add-row-there")?.textContent).toBe("In block");
    await act(async () =>
      sheet().querySelector<HTMLButtonElement>('[aria-label="Add Pull-ups"]')?.click()
    );
    expect(state.saveWorkout).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ kind: "strength", name: "Pull-ups" })
    );
    const [[id]] = state.saveWorkout.mock.calls as unknown as [[string]];
    expect(state.add).toHaveBeenCalledWith(id);
  });
});
