import { describe, expect, it } from "@jest/globals";
import type { Block, Membership } from "@sendtally/core/hang";
import { plannedIn } from "./planText";

const today = "2026-09-30";
const weekly: Membership = {
  id: "m1",
  workoutId: "w1",
  blockId: null,
  weekdays: [0],
  start: "2026-09-01",
  position: 0,
};
const inBlock: Membership = { ...weekly, blockId: "b1" };
const block = (start: string | null, weeks = 4): Block => ({
  id: "b1",
  name: "Power phase",
  start,
  weeks,
  focus: null,
});

describe("planned in", () => {
  it("says which week of a running block", () => {
    expect(plannedIn(inBlock, block("2026-09-21"), today)).toEqual({
      name: "Power phase",
      meta: "Week 2 of 4",
    });
  });

  it("says when a block starts, and nothing more of a template or a finished block", () => {
    expect(plannedIn(inBlock, block("2026-10-05"), today).meta).toBe("Starts Oct 5");
    expect(plannedIn(inBlock, block(null), today)).toEqual({ name: "Power phase", meta: "" });
    expect(plannedIn(inBlock, block("2026-08-03"), today).meta).toBe("");
  });

  it("calls a weekly plan Ongoing, saying when it starts if it has not", () => {
    expect(plannedIn(weekly, null, today)).toEqual({ name: "Ongoing", meta: "" });
    expect(plannedIn({ ...weekly, start: "2026-10-05" }, null, today).meta).toBe("Starts Oct 5");
  });

  it("names a one-off by its day", () => {
    expect(plannedIn({ ...weekly, weekdays: [], start: "2026-11-12" }, null, today)).toEqual({
      name: "Thu, Nov 12",
      meta: "",
    });
  });
});
