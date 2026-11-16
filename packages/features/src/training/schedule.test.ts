import { describe, expect, it } from "vitest";
import type { Block } from "@sendtally/core/hang";
import {
  blockDates,
  newSchedule,
  scheduleAddLabel,
  scheduledMemberships,
  scheduleReady,
  toggled,
} from "./schedule";
import { daysInWeek } from "./weekDays";

const TODAY = "2026-10-22";
const block: Block = {
  id: "b1",
  name: "Winter base",
  description: "",
  start: "2026-11-02",
  weeks: 6,
  focus: null,
};

const ids = (): (() => string) => {
  let n = 0;
  return () => `m${++n}`;
};

describe("newSchedule", () => {
  it("opens on the weekday and date it was asked from", () => {
    expect(newSchedule("2026-11-05", TODAY)).toEqual({
      mode: "repeat",
      weekdays: [3],
      dates: ["2026-11-05"],
      start: "2026-11-05",
    });
  });

  it("starts today with nothing picked, and never offers a past date", () => {
    expect(newSchedule(null, TODAY)).toMatchObject({ weekdays: [], dates: [], start: TODAY });
    expect(newSchedule("2026-10-19", TODAY)).toMatchObject({ dates: [], start: TODAY });
  });
});

describe("toggled", () => {
  it("adds in order and takes out", () => {
    expect(toggled([3, 0], 1)).toEqual([0, 1, 3]);
    expect(toggled([0, 1, 3], 1)).toEqual([0, 3]);
  });
});

describe("scheduledMemberships", () => {
  const draft = newSchedule(null, TODAY);

  it("saves one weekly plan from its start", () => {
    const weekly = { ...draft, weekdays: [3, 0] as (0 | 3)[] };
    expect(scheduledMemberships(weekly, "w1", ids(), 0)).toEqual([
      { id: "m1", workoutId: "w1", blockId: null, weekdays: [0, 3], start: TODAY, position: 0 },
    ]);
  });

  it("saves a one-off per date, in order", () => {
    const dates = { ...draft, mode: "dates" as const, dates: ["2026-11-10", "2026-10-28"] };
    expect(scheduledMemberships(dates, "w1", ids(), 0)).toEqual([
      { id: "m1", workoutId: "w1", blockId: null, weekdays: [], start: "2026-10-28", position: 0 },
      { id: "m2", workoutId: "w1", blockId: null, weekdays: [], start: "2026-11-10", position: 0 },
    ]);
  });

  it("is ready once it says when", () => {
    expect(scheduleReady(draft)).toBe(false);
    expect(scheduleReady({ ...draft, weekdays: [1] })).toBe(true);
    expect(scheduleReady({ ...draft, mode: "dates", dates: ["2026-10-28"] })).toBe(true);
  });
});

describe("blockDates", () => {
  it("puts each date's weekday in its block week", () => {
    const days = blockDates("m1", block, ["2026-11-10", "2026-10-28", "2026-11-12"]);
    expect([1, 2, 3].map((w) => daysInWeek(days, w))).toEqual([[], [1, 3], []]);
  });
});

describe("scheduleAddLabel", () => {
  const draft = newSchedule(null, TODAY);
  it("says the weekdays when repeating, the date or count when on days", () => {
    expect(scheduleAddLabel({ ...draft, mode: "repeat", weekdays: [] }, 0, undefined)).toBe("Add");
    expect(scheduleAddLabel({ ...draft, mode: "repeat", weekdays: [1, 4] }, 0, undefined)).toBe(
      "Add every Tue, Fri"
    );
    expect(scheduleAddLabel({ ...draft, mode: "dates" }, 1, "2026-11-05")).toBe(
      "Add on Thu, Nov 5"
    );
    expect(scheduleAddLabel({ ...draft, mode: "dates" }, 3, "2026-11-05")).toBe("Add on 3 days");
  });
});
