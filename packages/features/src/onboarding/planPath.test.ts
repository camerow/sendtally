import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import { EMPTY_PATH, resumedPath } from "./planPath";

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

describe("resumedPath", () => {
  it("rebuilds a walk from the newest draft block", () => {
    const plan: Blocks = {
      blocks: [block("old", "2026-11-02"), block("draft", null)],
      memberships: [member("m1", "old", "w-old"), member("m2", "draft", "w1")],
    };
    expect(resumedPath(EMPTY_PATH, plan, [])).toMatchObject({
      blockId: "draft",
      workouts: ["w1"],
      members: { w1: "m2" },
    });
  });

  it("takes the scheduled block once P4 has run, so P5 to P7 show the plan", () => {
    const plan: Blocks = {
      blocks: [block("winter", "2026-11-23")],
      memberships: [member("m1", "winter", "w1")],
    };
    expect(resumedPath(EMPTY_PATH, plan, [])).toMatchObject({
      blockId: "winter",
      workouts: ["w1"],
      days: { w1: [1, 3] },
    });
  });

  it("falls back to the newest workout with no block, and keeps a walk already in memory", () => {
    const mine = [
      { id: "a", updatedAt: "2026-11-01T00:00:00Z" },
      { id: "b", updatedAt: "2026-11-02T00:00:00Z" },
    ];
    expect(resumedPath(EMPTY_PATH, { blocks: [], memberships: [] }, mine).workouts).toEqual(["b"]);
    const held = { ...EMPTY_PATH, workouts: ["x"] };
    expect(resumedPath(held, { blocks: [], memberships: [] }, mine)).toBe(held);
  });
});
