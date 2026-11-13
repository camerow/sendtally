import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { Block, DatedBlock, Workout } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { changedWeeks, everyWeekFrom, ladderDone, ranMark, weekChangesOf } from "./ladder";

// Mondays from 28 September, three weeks; Legs on Monday and Thursday.
const block: DatedBlock = { id: "b1", name: "Base", start: "2026-09-28", weeks: 3, focus: null };
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

const done = (date: string, week: number): Activity => ({
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
  week,
  focus: null,
  done: [],
});

const log = (activities: Activity[]): TrainingLog => ({
  climbs: [],
  hangs: [],
  activities,
  plan: {
    blocks: [block],
    memberships: [
      {
        id: "m1",
        workoutId: "w1",
        blockId: "b1",
        weekdays: [0, 3],
        start: block.start,
        position: 0,
      },
    ],
    weekChanges: [
      { membershipId: "m1", week: 2, dose: 0, itemId: "i1", change: { reps: 6 } },
      { membershipId: "m1", week: 3, dose: 1, itemId: "i1", change: { reps: 8 } },
    ],
    planChanges: [],
    membershipDays: [],
  },
  workout: (id) => (id === "w1" ? legs : undefined),
});

describe("weekChangesOf and changedWeeks", () => {
  it("reads one dose's change each week, and names the weeks that change it", () => {
    const changes = weekChangesOf(log([]).plan, {
      membershipId: "m1",
      weeks: 3,
      dose: 0,
      itemId: "i1",
    });
    expect(changes).toEqual([{}, { reps: 6 }, {}]);
    expect(changedWeeks(changes)).toEqual(["changes W2"]);
    expect(changedWeeks([{}, {}])).toEqual([]);
  });
});

describe("ladderDone", () => {
  it("counts runs up to this week, and nothing on a template", () => {
    const counts = ladderDone(log([done("2026-09-28", 1)]), block, "m1", "2026-10-06");
    expect(counts).toEqual([{ done: 1, planned: 2 }, { done: 0, planned: 2 }, null]);
    expect(ladderDone(log([]), template, "m1", "2026-10-06")).toBeNull();
  });
});

describe("everyWeekFrom", () => {
  it("is this week while it runs, the first before it starts, none once over", () => {
    expect(everyWeekFrom(template, "2026-10-06")).toBe(1);
    expect(everyWeekFrom(block, "2026-09-01")).toBe(1);
    expect(everyWeekFrom(block, "2026-10-06")).toBe(2);
    expect(everyWeekFrom(block, "2026-11-30")).toBeNull();
  });
});

describe("ranMark", () => {
  it("marks a done or missed day, and nothing still planned", () => {
    const l = log([done("2026-09-28", 1)]);
    expect(ranMark(l, "m1", "2026-09-28", "2026-10-06")).toBe("done");
    expect(ranMark(l, "m1", "2026-10-01", "2026-10-06")).toBe("missed");
    expect(ranMark(l, "m1", "2026-10-08", "2026-10-06")).toBeNull();
  });
});
