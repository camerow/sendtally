import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import type { Block } from "@sendtally/core/hang";
import {
  addToBlockOptions,
  canStepWeeks,
  clampWeeks,
  keptName,
  MAX_BLOCK_WEEKS,
  newBlock,
} from "./blockMeta";

const template: Block = { id: "t1", name: "Power", start: null, weeks: 4, focus: null };
const running: Block = { ...template, id: "b1", name: "Base", start: "2026-11-09" };
const over: Block = { ...template, id: "b0", name: "Autumn", start: "2026-09-01", weeks: 2 };

describe("block length", () => {
  it("keeps a length between the weeks run and the most a block can run", () => {
    expect(clampWeeks(0)).toBe(1);
    expect(clampWeeks(3, 2)).toBe(3);
    expect(clampWeeks(1, 2)).toBe(2);
    expect(clampWeeks(40)).toBe(MAX_BLOCK_WEEKS);
    expect(canStepWeeks({ weeks: 2 }, -1, 2)).toBe(false);
    expect(canStepWeeks({ weeks: MAX_BLOCK_WEEKS }, 1)).toBe(false);
    expect(canStepWeeks({ weeks: 4 }, 1)).toBe(true);
  });
});

describe("keptName", () => {
  it("lets a template go unnamed, but a scheduled block keeps its name", () => {
    expect(keptName("", template, "Power")).toBe("");
    expect(keptName("", running, "Base")).toBe("Base");
    expect(keptName("Strength", running, "Base")).toBe("Strength");
  });
});

describe("newBlock", () => {
  it("is an untitled four-week template", () => {
    expect(newBlock("n1")).toEqual({ id: "n1", name: "", start: null, weeks: 4, focus: null });
  });
});

describe("addToBlockOptions", () => {
  it("offers every block not over yet, marking those that already hold the workout", () => {
    const plan: Pick<Plan, "blocks" | "memberships"> = {
      blocks: [template, running, over],
      memberships: [
        {
          id: "m1",
          workoutId: "w1",
          blockId: "b1",
          weekdays: [],
          start: "2026-11-09",
          position: 0,
        },
      ],
    };
    expect(addToBlockOptions(plan, "w1", "2026-11-12").map((o) => [o.block.id, o.there])).toEqual([
      ["t1", false],
      ["b1", true],
    ]);
  });
});
