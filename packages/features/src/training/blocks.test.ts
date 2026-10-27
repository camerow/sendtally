import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import type { Block } from "@sendtally/core/hang";
import { blockMembers } from "./blocks";

const block: Block = { id: "b1", name: "Autumn finger block", start: "2026-09-28", weeks: 3 };

describe("blockMembers", () => {
  it("takes only the block's own memberships", () => {
    const plan: Plan = {
      blocks: [block],
      memberships: [
        { id: "m1", workoutId: "w1", blockId: "b1", weekdays: [0], start: block.start },
        { id: "m2", workoutId: "w1", blockId: null, weekdays: [0], start: block.start },
        { id: "m3", workoutId: "w1", blockId: "b2", weekdays: [0], start: block.start },
      ],
      weekChanges: [],
    };
    expect(blockMembers(plan, block).map((m) => m.id)).toEqual(["m1"]);
  });
});
