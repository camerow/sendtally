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
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

const plan: Plan = {
  blocks: [],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
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
            <Route
              path="/schedule"
              element={<SchedulePage workoutId="legs" flow={{ date: null, blockId: null }} />}
            />
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
  it("adds the workout every week on the days picked, from the start day, then shows the plan", () => {
    expect(add().disabled).toBe(true);
    const chips = container.querySelectorAll<HTMLButtonElement>(".weekday-chip");
    act(() => chips[1]?.click());
    act(() => chips[4]?.click());
    expect(add().textContent).toBe("Add every Tue, Fri");
    act(() => add().click());
    expect(writes.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({ workoutId: "legs", weekdays: [1, 4], start: "2026-11-12" })
    );
    expect(container.textContent).toBe("plan");
  });
});
