import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Route, Routes, useLocation } from "react-router";
import { TestRouter } from "../../lib/TestRouter";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { itemIdOf, type Block } from "@sendtally/core/hang";
import { hangModel } from "@sendtally/features/hang";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { hangData } from "../data/testHang";
import { LadderPage } from "./LadderPage";

import type * as T_training from "@sendtally/features/training";
import type * as T_useLibrary from "../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const TODAY = "2026-11-12";

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
  deleteMembership: vi.fn(async () => undefined),
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({ model: hangModel(hangData(), libraryOf([])), today: TODAY }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "ready", data: state.plan }, reload: vi.fn() }),
  useTrainingLog: () => ({
    log: {
      climbs: [],
      hangs: [],
      activities: [],
      plan: state.plan,
      workout: (id: string) => libraryOf([legs]).find((w) => w.id === id),
    },
    ready: true,
  }),
  usePlanActions: () => state,
}));

const template: Block = { id: "b1", name: "Power phase", start: null, weeks: 3, focus: null };
const itemId = itemIdOf(legs.items[0] ?? {}, 0);

let container: HTMLDivElement;
let root: Root;
const at = { path: "" };

function Spy(): null {
  const path = useLocation().pathname;
  React.useEffect(() => {
    at.path = path;
  }, [path]);
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  state.plan = {
    blocks: [template],
    memberships: [
      { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [0, 3], start: TODAY, position: 0 },
    ],
    weekChanges: [{ membershipId: "m1", week: 2, dose: 0, itemId, change: { reps: 6 } }],
    planChanges: [],
    membershipDays: [],
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <ToastProvider>
        <TestRouter
          initialEntries={["/app/plan/block/b1", "/app/plan/membership/m1"]}
          initialIndex={1}
        >
          <Spy />
          <Routes>
            <Route path="/app/plan/block/:id" element={<p>Block</p>} />
            <Route path="/app/plan/membership/:id" element={<LadderPage id="m1" />} />
            <Route path="/app/train/workouts/:id/edit" element={<p>Editor</p>} />
            <Route path="/app/train" element={<p>Train</p>} />
          </Routes>
        </TestRouter>
      </ToastProvider>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());

const button = (text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === text);

const values = (): string[] =>
  [...container.querySelectorAll(".load-row")]
    .map((r) => r.querySelector(".load-cell--marked") !== null)
    .map(String);

describe("LadderPage", () => {
  it("shows its days by week and its weekly load, gold where a week changes it", () => {
    expect(container.querySelector(".block-title")?.textContent).toBe("Gym, legs");
    expect(container.querySelectorAll(".week-days-row:not(.week-days-head)")).toHaveLength(3);
    expect(values()).toEqual(["false", "true", "false"]);
  });

  it("edits a week's load and days, saved together", () => {
    click(button("Edit"));
    expect(container.textContent).toContain("Every week");
    click(container.querySelector('[role="checkbox"][aria-label="Week 1, Tuesday"]'));
    const cell = container.querySelector<HTMLInputElement>(".load-row .number-field-input")!;
    act(() => {
      cell.focus();
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      set?.call(cell, "4");
      cell.dispatchEvent(new Event("input", { bubbles: true }));
      cell.blur();
    });
    click(button("Save"));
    expect(state.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        weekChanges: [expect.objectContaining({ membershipId: "m1", week: 1 })],
        schedules: [expect.objectContaining({ membershipId: "m1" })],
      })
    );
  });

  it("edits the user's own workout in the editor", () => {
    click(document.querySelector('[aria-label="More"]'));
    click(button("Edit workout"));
    expect(at.path).toBe("/app/train/workouts/legs/edit");
  });

  it("asks before removing it from the block, then goes back", () => {
    click(document.querySelector('[aria-label="More"]'));
    click(button("Remove from block"));
    click(document.querySelector(".sheet-action--danger"));
    expect(state.deleteMembership).toHaveBeenCalledWith("m1");
    expect(at.path).toBe("/app/train");
  });
});
