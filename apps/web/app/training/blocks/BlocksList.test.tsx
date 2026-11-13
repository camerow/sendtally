import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type { Block, Weekday } from "@sendtally/core/hang";
import { hangModel } from "@sendtally/features/hang";
import { libraryOf } from "@sendtally/features/workouts";
import { hangData } from "../data/testHang";
import { BlocksList } from "./BlocksList";

import type * as T_training from "@sendtally/features/training";

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
  saveBlock: vi.fn(async () => undefined),
  deleteBlock: vi.fn(async () => undefined),
  saveDraft: vi.fn(async () => undefined),
  copyBlock: vi.fn(async () => true),
  saveMembership: vi.fn(async () => undefined),
  deleteMembership: vi.fn(async () => undefined),
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
  useAddTo: () => ({ add: vi.fn(), undo: vi.fn(), plans: [] }),
}));

const template: Block = { id: "b1", name: "Power phase", start: null, weeks: 4, focus: null };
// Monday to two Sundays on, running this week.
const running: Block = { ...template, start: "2026-11-09", weeks: 2 };
const over: Block = { ...template, start: "2026-10-05", weeks: 2 };

const withBlock = (block: Block, weekdays: Weekday[] = [3]): Plan => ({
  blocks: [block],
  memberships: [
    {
      id: "m1",
      workoutId: "legs",
      blockId: block.id,
      weekdays,
      start: block.start ?? TODAY,
      position: 0,
    },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
});

let container: HTMLDivElement;
let root: Root;

const mount = (plan: Plan): void => {
  state.plan = plan;
  act(() =>
    root.render(
      <MemoryRouter>
        <BlocksList />
      </MemoryRouter>
    )
  );
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const sections = (): string[] =>
  [...container.querySelectorAll(".blocks-section-title")].map((h) => h.textContent ?? "");

const upcoming: Block = { ...template, id: "b2", name: "Spring", start: "2026-11-23", weeks: 6 };

describe("BlocksList", () => {
  it("lists active, upcoming, templates and completed, each opening its block", () => {
    const plan = withBlock(running);
    mount({
      ...plan,
      blocks: [running, upcoming, { ...template, id: "b3" }, { ...over, id: "b4" }],
    });
    expect(sections()).toEqual(["Active", "Upcoming", "Templates", "Completed"]);
    expect(container.querySelector(".group-card-head")?.getAttribute("href")).toBe(
      "/app/plan/block/b1"
    );
    const rows = [...container.querySelectorAll(".block-row")];
    expect(rows.map((r) => r.getAttribute("href"))).toEqual([
      "/app/plan/block/b2",
      "/app/plan/block/b3",
      "/app/plan/block/b4",
    ]);
    expect(rows[0]?.querySelector(".block-row-meta")?.textContent).toBe(
      "Starts Mon, Nov 23 · 6 weeks"
    );
  });

  it("leaves out sections with nothing in them", () => {
    mount({ ...withBlock(template), memberships: [] });
    expect(sections()).toEqual(["Templates"]);
  });

  it("shows the empty panel alone when nothing is planned", () => {
    mount({ ...withBlock(template), blocks: [], memberships: [] });
    expect(sections()).toEqual([]);
    expect(container.querySelector(".dashed-panel")).not.toBeNull();
  });
});
