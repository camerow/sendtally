import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import {
  CLIMBING,
  EMPTY_PATH,
  placedWorkouts,
  seededPath,
  withDay,
  withKnown,
  pickToggled,
  type PlanPath,
} from "./planPath";

type Blocks = Pick<Plan, "blocks" | "memberships">;

const block = (id: string, start: string | null): Blocks["blocks"][number] =>
  ({ id, name: id, start, weeks: 4 }) as unknown as Blocks["blocks"][number];

const member = (id: string, blockId: string, workoutId: string): Blocks["memberships"][number] =>
  ({
    id,
    blockId,
    workoutId,
    weekdays: [1, 3],
    position: 0,
  }) as unknown as Blocks["memberships"][number];

describe("seededPath", () => {
  it("rebuilds a walk from the newest dated block, never from a template", () => {
    const plan: Blocks = {
      blocks: [block("old", "2026-11-02"), block("new", "2026-11-23"), block("template", null)],
      memberships: [
        member("m1", "old", "w-old"),
        member("m2", "new", "w1"),
        member("m3", "template", "w-template"),
      ],
    };
    expect(seededPath(EMPTY_PATH, plan)).toMatchObject({
      blockId: "new",
      workouts: ["w1"],
      members: { w1: "m2" },
    });
  });

  it("starts a new walk when the only block with workouts is a template", () => {
    const plan: Blocks = {
      blocks: [block("template", null)],
      memberships: [member("m1", "template", "w1")],
    };
    expect(seededPath(EMPTY_PATH, plan)).toEqual({
      ...EMPTY_PATH,
      workouts: [CLIMBING],
      seeded: true,
    });
  });

  it("takes the scheduled block once Build your week has run, so the reveal shows the plan", () => {
    const plan: Blocks = {
      blocks: [block("winter", "2026-11-23")],
      memberships: [member("m1", "winter", "w1")],
    };
    expect(seededPath(EMPTY_PATH, plan)).toMatchObject({
      blockId: "winter",
      workouts: ["w1"],
      days: { w1: [1, 3] },
    });
  });

  it("starts a new walk with Climbing picked, and keeps a walk already in memory", () => {
    const none = { blocks: [], memberships: [] };
    expect(seededPath(EMPTY_PATH, none)).toEqual({
      ...EMPTY_PATH,
      workouts: [CLIMBING],
      seeded: true,
    });
    const held = { ...EMPTY_PATH, workouts: ["x"], seeded: true };
    expect(seededPath(held, none)).toBe(held);
  });
});

describe("picking and placing", () => {
  it("picks a workout last, puts it on days in order, and takes it back with its days", () => {
    const picked = pickToggled({ ...EMPTY_PATH, workouts: ["a"] }, "b");
    expect(picked.workouts).toEqual(["a", "b"]);
    const placed = withDay(withDay(withDay(picked, "b", 4), "b", 0), "b", 2);
    expect(placed.days).toEqual({ b: [0, 2, 4] });
    expect(withDay(placed, "b", 2).days).toEqual({ b: [0, 4] });
    expect(pickToggled(placed, "b")).toEqual({ ...EMPTY_PATH, workouts: ["a"], days: {} });
  });

  it("drops a workout the library no longer has, with its days", () => {
    const walk = withDay(withDay(pickToggled(EMPTY_PATH, "gone"), "gone", 1), CLIMBING, 0);
    const known = withKnown({ ...walk, workouts: [CLIMBING, "gone"] }, (id) => id !== "gone");
    expect(known.workouts).toEqual([CLIMBING]);
    expect(Object.keys(known.days)).toEqual([CLIMBING]);
    expect(withKnown(known, () => true)).toBe(known);
  });

  it("leaves a picked workout with no day out of the block", () => {
    const p: PlanPath = { ...EMPTY_PATH, workouts: ["a", "b", "c"], days: { a: [1], b: [] } };
    expect(placedWorkouts(p)).toEqual(["a"]);
  });
});
