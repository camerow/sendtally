import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import type * as T_exercises from "@sendtally/features/exercises";
import { setPlanPath, type PlanPath, type Wizard } from "@sendtally/features/settings";
import type * as T_statistics from "@sendtally/features/statistics";
import type * as T_workouts from "@sendtally/features/workouts";
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
  position: { n: 0, total: 0 },
  memory: { way: null, existingLog: null },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  open: vi.fn(),
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

const pickedNow = (): readonly string[] => {
  const seen: PlanPath[] = [];
  setPlanPath((p) => {
    seen.push(p);
    return p;
  });
  return seen[0]?.workouts ?? [];
};

describe("Build my own, opened from Build your week", () => {
  it("has no name to type and no Skip, names the workout by its kind and puts it first", async () => {
    setPlanPath(() => ({
      workouts: ["climb-session"],
      days: {},
      members: {},
      blockId: null,
      seeded: true,
    }));
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <ToastProvider>
            <MemoryRouter>
              <WithHang>
                <WorkoutBuilder wizard={wizard} api={{} as SendtallyApi} />
              </WithHang>
            </MemoryRouter>
          </ToastProvider>
        </QueryClientProvider>
      )
    );
    expect(host.querySelector('textarea[aria-label="Workout name"]')).toBeNull();
    expect(host.textContent).not.toContain("Skip");
    const search = host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    act(() => {
      search.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
        search,
        "Zercher"
      );
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const option = [...host.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (o) => o.textContent === "Zercher squat"
    );
    await act(async () => option?.click());
    const next = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.startsWith("Continue · 1 exercise")
    );
    act(() => next?.click());
    const [id] = pickedNow();
    expect(writes.saveWorkout).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ name: "Strength workout" })
    );
    expect(pickedNow()).toEqual([id, "climb-session"]);
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
