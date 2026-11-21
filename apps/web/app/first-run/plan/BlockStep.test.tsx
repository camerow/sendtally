import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Plan, SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import type * as T_useLibrary from "../../training/library/useLibrary";
import { WithHang } from "../../training/data/testHang";
import { BlockStep } from "./BlockStep";

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
  focus: null,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "", description: "", start: null, weeks: 4, focus: null }],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [1], start: "2026-10-05", position: 0 },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const actions = vi.hoisted(() => ({
  saveDraft: vi.fn(async () => undefined),
  saveMembership: vi.fn(async () => undefined),
}));

vi.mock("../../training/data/usePlanActions", () => ({ usePlanActions: () => actions }));
vi.mock("../../training/library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => {
    const workouts = libraryOf([legs]);
    const data: WorkoutLibrary = {
      workouts,
      usage: new Map(),
      workout: (id) => workouts.find((w) => w.id === id),
    };
    return { state: { status: "ready", data }, reload: vi.fn() };
  },
}));

const wizard = {
  path: "plan",
  step: "P4",
  canGoBack: true,
  position: { n: 4, total: 7 },
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
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  setPlanPath(() => ({
    workouts: ["legs"],
    days: { legs: [1] },
    members: { legs: "m1" },
    blockId: "b1",
    building: "legs",
  }));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("P4's name", () => {
  it("starts as the month the block starts in, so Schedule is on without typing", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
    });
    client.setQueryData(["plan", "days"], plan);
    client.setQueryData(["workouts"], [legs]);
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <WithHang>
              <BlockStep wizard={wizard} api={{} as SendtallyApi} />
            </WithHang>
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    const field = host.querySelector<HTMLTextAreaElement>('textarea[aria-label="Block name"]');
    expect(field?.value).toBe("October block");
    const schedule = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.startsWith("Schedule from")
    );
    expect(schedule?.disabled).toBe(false);
    act(() => schedule?.click());
    expect(actions.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ block: expect.objectContaining({ name: "October block" }) })
    );
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
