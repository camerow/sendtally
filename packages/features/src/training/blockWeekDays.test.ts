import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { Block, DatedBlock, Workout } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { pastMeta, templateMeta } from "./blockMeta";
import { blockWeekColumns, blockWeekDates, cellMark, weekPlans } from "./blockWeekDays";

// Starts on a Wednesday, so its weeks run Wednesday to Tuesday.
const block: DatedBlock = { id: "b1", name: "Base", start: "2026-09-30", weeks: 2, focus: null };
const template: Block = { ...block, start: null };

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

const done = (date: string): Activity => ({
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
});

const log = (activities: Activity[], blocks: Block[] = [block]): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities,
  plan: {
    blocks,
    memberships: [
      {
        id: "m1",
        workoutId: "w1",
        blockId: "b1",
        weekdays: [2, 4],
        start: block.start,
        position: 0,
      },
    ],
    weekChanges: [],
    planChanges: [],
    membershipDays: [],
  },
  workout: (id) => (id === "w1" ? legs : undefined),
});

describe("blockWeekDates", () => {
  it("dates each weekday Monday first within the block week", () => {
    expect(blockWeekDates(block, 1)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(blockWeekDates(block, 2)?.[2]).toBe("2026-10-07");
  });

  it("has no dates on a template or without a week", () => {
    expect(blockWeekDates(template, 1)).toBeNull();
    expect(blockWeekDates(block, undefined)).toBeNull();
  });
});

describe("blockWeekColumns", () => {
  it("runs from the start's weekday", () => {
    expect(blockWeekColumns(block, 1)).toEqual([2, 3, 4, 5, 6, 0, 1]);
    expect(blockWeekColumns(template, 1)).toBeUndefined();
  });
});

describe("cellMark", () => {
  it("marks done and planned days, and nothing where it is not planned", () => {
    const dates = blockWeekDates(block, 1) ?? [];
    const plans = weekPlans(log([done("2026-09-30")]), dates, "2026-10-01");
    expect(cellMark(plans[2] ?? [], "m1")).toBe("done");
    expect(cellMark(plans[4] ?? [], "m1")).toBe("planned");
    expect(cellMark(plans[0] ?? [], "m1")).toBeNull();
  });
});

describe("block meta", () => {
  it("counts a template's workouts and a past block's done", () => {
    expect(templateMeta(log([], [template]), template)).toBe("2 weeks · 1 workout");
    expect(pastMeta(log([done("2026-09-30")]), block, "2026-11-01")).toBe("2 weeks · 1 of 4 done");
  });
});
