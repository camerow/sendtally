import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { Block, Workout } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { blockDone, blockRecap, blockTagOf } from "./recap";

// Mondays from 28 September for two weeks.
const block: Block = {
  id: "b1",
  name: "Winter base",
  start: "2026-09-28",
  weeks: 2,
  focus: null,
};

const legs: Workout = {
  id: "w1",
  kind: "strength",
  name: "Legs",
  description: "",
  minutes: 40,
  targetRpe: null,
  items: [],
  exerciseRestS: 180,
  focus: null,
};

const squat = (weightKg: number): Activity["done"] => [
  { item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg }] },
];

const activity = (date: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `a-${date}`,
  kind: "strength",
  title: "Legs",
  date,
  startTime: null,
  minutes: 40,
  rpe: null,
  notes: null,
  workoutId: "w1",
  membershipId: "m1",
  week: 1,
  focus: null,
  done: [],
  ...overrides,
});

const log = (activities: Activity[]): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities,
  plan: {
    blocks: [block],
    memberships: [
      { id: "m1", workoutId: "w1", blockId: "b1", weekdays: [0, 3], start: block.start },
      { id: "m2", workoutId: "w1", blockId: null, weekdays: [0], start: block.start },
    ],
    weekChanges: [],
  },
  workout: (id) => (id === "w1" ? legs : undefined),
});

describe("blockRecap", () => {
  const done = log([
    activity("2026-09-28", { rpe: 6, done: squat(100) }),
    activity("2026-10-01", { rpe: 8, done: squat(102.5) }),
    activity("2026-10-05", { rpe: 7, membershipId: null, done: squat(105) }),
  ]);

  it("counts done, missed and planned over the block, and its average effort", () => {
    const recap = blockRecap(done, block, "2026-10-30");
    expect([recap.done, recap.planned, recap.missed]).toEqual([3, 4, 1]);
    expect(recap.effort).toBe(7);
    expect(blockDone(done, block, "2026-10-30")).toEqual({ done: 3, planned: 4 });
  });

  it("lays the weeks out with their own effort, an empty week having none", () => {
    expect(blockRecap(done, block, "2026-10-30").weeks).toEqual([
      { week: 1, done: 2, planned: 2, effort: 7 },
      { week: 2, done: 1, planned: 2, effort: 7 },
    ]);
    expect(blockRecap(log([]), block, "2026-10-30").weeks[0]?.effort).toBeNull();
  });

  it("counts so far up to today, while later days stay planned", () => {
    const recap = blockRecap(done, block, "2026-10-01");
    expect(recap.soFar).toEqual({ done: 2, planned: 2 });
    expect(recap.missed).toBe(0);
  });

  it("gives each workout its sessions and how its lead exercise moved", () => {
    const [w] = blockRecap(done, block, "2026-10-30").workouts;
    expect(w).toEqual({
      membershipId: "m1",
      workoutId: "w1",
      done: 3,
      planned: 4,
      change: { metric: "load", by: 2.5 },
    });
    const once = blockRecap(
      log([activity("2026-09-28", { done: squat(100) })]),
      block,
      "2026-10-30"
    );
    expect(once.workouts[0]?.change).toBeNull();
  });
});

describe("blockTagOf", () => {
  const { plan } = log([]);

  it("names the block and the week a session of its workouts ran in", () => {
    expect(blockTagOf(plan, "m1", "2026-10-06")).toBe("Winter base · W2");
    expect(blockTagOf(plan, "m1", "2026-11-30")).toBe("Winter base");
  });

  it("says nothing for a session outside a block's workouts", () => {
    expect(blockTagOf(plan, "m2", "2026-10-06")).toBeNull();
    expect(blockTagOf(plan, null, "2026-10-06")).toBeNull();
  });
});
