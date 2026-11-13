import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangModel } from "@sendtally/features/hang";
import { libraryOf } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { hangData } from "../data/testHang";
import { OngoingPage } from "./OngoingPage";

import type * as T_training from "@sendtally/features/training";

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

const state = vi.hoisted(() => ({
  plan: null as unknown as Plan,
  saveDraft: vi.fn(async () => undefined),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({ model: hangModel(hangData(), libraryOf([])), today: "2026-11-12" }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "ready", data: state.plan }, reload: vi.fn() }),
  usePlanActions: () => state,
  useTrainingLog: () => ({
    log: {
      climbs: [],
      hangs: [],
      activities: [],
      plan: state.plan,
      workout: (id: string) => libraryOf([legs]).find((w) => w.id === id),
    },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.plan = {
    blocks: [],
    memberships: [
      {
        id: "m1",
        workoutId: "legs",
        blockId: null,
        weekdays: [1, 4],
        start: "2026-11-02",
        position: 0,
      },
    ],
    weekChanges: [],
    planChanges: [],
    membershipDays: [],
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter>
        <ToastProvider>
          <OngoingPage />
        </ToastProvider>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const cells = (): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(".plan-grid-row:not(.plan-grid-row--head) .grid-cell")
  );
const on = (): boolean[] => cells().map((c) => c.querySelector(".day-mark") !== null);

describe("OngoingPage", () => {
  it("shows each weekly plan on its days", () => {
    expect(container.querySelector(".plan-row-name")?.textContent).toBe("Gym, legs");
    expect(on()).toEqual([false, true, false, false, true, false, false]);
  });

  it("sets days and takes a workout out in Edit, saving them together", () => {
    act(() => container.querySelector<HTMLButtonElement>(".outline-action")?.click());
    act(() => (cells()[2] as HTMLButtonElement).click());
    expect(on()).toEqual([false, true, true, false, true, false, false]);
    act(() => container.querySelector<HTMLButtonElement>(".ongoing-remove")?.click());
    expect(container.querySelector(".plan-grid-row:not(.plan-grid-row--head)")).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>(".detail-primary")?.click());
    expect(state.saveDraft).toHaveBeenCalledOnce();
  });
});
