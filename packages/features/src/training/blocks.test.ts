import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import type { Block } from "@sendtally/core/hang";
import { blockGroups, blockMembers } from "./blocks";

const block: Block = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 3,
  focus: null,
};

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

describe("blockGroups", () => {
  it("splits blocks into running, upcoming soonest first, and past latest first", () => {
    const at = (id: string, start: string): Block => ({
      id,
      name: id,
      start,
      weeks: 2,
      focus: null,
    });
    const groups = blockGroups(
      [
        at("old", "2026-08-03"),
        at("later", "2026-11-30"),
        at("now", "2026-10-05"),
        at("last", "2026-09-07"),
        at("next", "2026-10-26"),
      ],
      "2026-10-12"
    );
    expect({
      current: groups.current.map((b) => b.id),
      upcoming: groups.upcoming.map((b) => b.id),
      past: groups.past.map((b) => b.id),
    }).toEqual({ current: ["now"], upcoming: ["next", "later"], past: ["last", "old"] });
  });
});
