import { describe, expect, it } from "vitest";
import type { Activity } from "@sendtally/api-client";
import type { Block, DatedBlock, Workout } from "@sendtally/core/hang";
import type { TrainingLog } from "./days";
import { hangModel } from "../hang/model";
import { libraryOf } from "../workouts/library";
import {
  changedWeeks,
  everyWeekFrom,
  ladderDone,
  ladderView,
  loadSummary,
  ranMark,
  toggleIn,
  weekChangesOf,
  weekDaysRows,
} from "./ladder";
import type { DayToggle } from "./weekDays";
import { doneAll, doneText, isTimeField, weekFieldMarked, weekFieldUnit } from "./weeks";

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

describe("weekDaysRows", () => {
  const args = (editing: boolean, onToggle: (c: DayToggle) => void = () => undefined) => {
    const l = log([done("2026-09-28", 1)]);
    const m = l.plan.memberships[0]!;
    return { block, membership: m, plan: l.plan, log: l, today: "2026-10-06", editing, onToggle };
  };

  it("marks days gone by, and lists each week with its start", () => {
    const { columns, every, weeks } = weekDaysRows(args(false));
    expect(columns).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(every).toBeNull();
    expect(weeks.map((w) => [w.name, w.sub, w.bold])).toEqual([
      ["Week 1", "Sep 28", false],
      ["Week 2", "Oct 5", true],
      ["Week 3", "Oct 12", false],
    ]);
    expect(weeks[0]?.cells[0]).toEqual({ day: 0, on: true, mark: "done" });
    expect(weeks[0]?.cells[3]).toEqual({ day: 3, on: true, mark: "missed" });
    expect(weeks[2]?.cells[3]).toEqual({ day: 3, on: true });
  });

  it("in Edit mode sets Every week from this week on, and a day from today on alone", () => {
    const toggles: unknown[] = [];
    const { every, weeks } = weekDaysRows(args(true, (c) => void toggles.push(c)));
    expect(every?.sub).toBe("From week 2 on");
    every?.cells[1]?.toggle?.();
    weeks[1]?.cells[2]?.toggle?.();
    expect(weeks[0]?.cells[0]?.toggle).toBeUndefined();
    expect(toggles).toEqual([
      { week: 2, day: 1, following: true, last: 3, every: true },
      { week: 2, day: 2, following: false, last: 3 },
    ]);
  });
});

describe("ladderView", () => {
  it("reads a workout in its block for a turn, and nothing once it is gone", () => {
    const l = log([]);
    const model = hangModel(
      {
        grips: [],
        defaultGrips: {},
        loads: {},
        sessions: [],
        settings: {
          units: "kg",
          theme: "gunmetal",
          reminders: false,
          reminderTime: "08:00",
          postToStrava: false,
          reminderPromptSeen: true,
        },
        strava: { connected: false },
      },
      libraryOf([])
    );
    const view = ladderView(l.plan, l, model, "m1", 0, "2026-10-06");
    expect(view?.workout.name).toBe("Legs");
    expect(view?.turns).toBe(1);
    expect(view?.current).toBe(2);
    expect(ladderView(l.plan, l, model, "gone", 0, "2026-10-06")).toBeNull();
  });
});

describe("load table helpers", () => {
  it("says what a week changes, and toggles a section open or shut", () => {
    expect(loadSummary("strength", { sets: 3, reps: 5 }, "kg", [{}, { reps: 6 }])).toBe(
      "3 × 5 · changes W2"
    );
    expect(toggleIn([0, 2], 2)).toEqual([0]);
    expect(toggleIn([0], 2)).toEqual([0, 2]);
  });

  it("reads a field's unit, time, mark and done counts", () => {
    expect(weekFieldUnit("weightKg", "lb")).toBe("lb");
    expect(weekFieldUnit("edgeMm", "kg")).toBe("mm");
    expect(weekFieldUnit("reps", "kg")).toBeNull();
    expect(isTimeField("setRestS")).toBe(true);
    expect(isTimeField("reps")).toBe(false);
    expect(weekFieldMarked({ reps: 6 }, { sets: 3, reps: 5 }, "reps")).toBe(true);
    expect(weekFieldMarked({ reps: 5 }, { sets: 3, reps: 5 }, "reps")).toBe(false);
    expect(doneText({ done: 2, planned: 3 })).toBe("2/3");
    expect(doneText(null)).toBe("");
    expect(doneAll({ done: 3, planned: 3 })).toBe(true);
    expect(doneAll({ done: 0, planned: 0 })).toBe(false);
  });
});
