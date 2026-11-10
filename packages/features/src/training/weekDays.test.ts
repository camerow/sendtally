import { describe, expect, it } from "vitest";
import type { Weekday } from "@sendtally/core/hang";
import {
  daysInWeek,
  daysThisWeek,
  ownWeeksAfter,
  usualDays,
  withFollowing,
  withoutFollowing,
  withWeekDays,
  type DaySchedule,
} from "./weekDays";

const MON_THU: Weekday[] = [0, 3];
const schedule = (weeks: [number, Weekday[]][] = []): DaySchedule => ({
  membershipId: "m",
  weekdays: MON_THU,
  weeks: weeks.map(([fromWeek, weekdays]) => ({ membershipId: "m", fromWeek, weekdays })),
});
const weeksOf = (s: DaySchedule, last = 6): Weekday[][] =>
  Array.from({ length: last }, (_, i) => daysInWeek(s, i + 1));

describe("daysThisWeek", () => {
  const m = {
    id: "m",
    workoutId: "w",
    blockId: "b",
    weekdays: [],
    start: "2026-09-21",
    position: 0,
  };
  const membershipDays = [{ membershipId: "m", fromWeek: 2, weekdays: [1] as Weekday[] }];
  const block = { start: "2026-09-21", weeks: 4 };

  it("reads the week the block is on", () => {
    expect(daysThisWeek({ membershipDays }, m, block, "2026-09-30")).toEqual([1]);
    expect(daysThisWeek({ membershipDays }, m, block, "2026-09-22")).toEqual([]);
  });

  it("reads the first week of a block not running, and a plan in no block", () => {
    const set = [{ membershipId: "m", fromWeek: 1, weekdays: [4] as Weekday[] }];
    expect(daysThisWeek({ membershipDays: set }, m, block, "2026-09-01")).toEqual([4]);
    expect(
      daysThisWeek({ membershipDays: set }, m, { start: null, weeks: 4 }, "2026-09-30")
    ).toEqual([4]);
    expect(
      daysThisWeek({ membershipDays: [] }, { ...m, weekdays: [2] }, null, "2026-09-30")
    ).toEqual([2]);
  });
});

describe("withWeekDays", () => {
  it("sets one week alone, the weeks after keeping the days they had", () => {
    const next = withWeekDays(schedule(), { week: 3, weekdays: [1], following: false, last: 6 });
    expect(weeksOf(next)).toEqual([MON_THU, MON_THU, [1], MON_THU, MON_THU, MON_THU]);
    expect(next.weeks.map((d) => d.fromWeek)).toEqual([3, 4]);
  });

  it("leaves a later week's own days alone, and adds nothing past the last week", () => {
    const own = schedule([[5, [6]]]);
    expect(
      weeksOf(withWeekDays(own, { week: 4, weekdays: [1], following: false, last: 6 }))
    ).toEqual([MON_THU, MON_THU, MON_THU, [1], [6], [6]]);
    const last = withWeekDays(schedule(), { week: 6, weekdays: [1], following: false, last: 6 });
    expect(last.weeks.map((d) => d.fromWeek)).toEqual([6]);
  });

  it("sets a week and every one after it, replacing later weeks' own days", () => {
    const own = schedule([
      [2, [1]],
      [5, [6]],
    ]);
    const next = withWeekDays(own, { week: 3, weekdays: [2, 4], following: true, last: 6 });
    expect(weeksOf(next)).toEqual([MON_THU, [1], [2, 4], [2, 4], [2, 4], [2, 4]]);
    expect(ownWeeksAfter(own, 3)).toEqual([5]);
  });

  it("sets week 1 alone apart from the pattern, the weeks after keeping it", () => {
    const one = withWeekDays(schedule(), { week: 1, weekdays: [1], following: false, last: 6 });
    expect(one.weekdays).toEqual(MON_THU);
    expect(weeksOf(one)).toEqual([[1], MON_THU, MON_THU, MON_THU, MON_THU, MON_THU]);
  });

  it("makes a change from week 1 on the workout's own days, and drops changes that repeat", () => {
    const every = withWeekDays(schedule([[4, [6]]]), {
      week: 1,
      weekdays: [5, 2],
      following: true,
      last: 6,
    });
    expect(every).toEqual({ membershipId: "m", weekdays: [2, 5], weeks: [] });
    const back = withWeekDays(
      schedule([
        [3, [1]],
        [4, MON_THU],
      ]),
      {
        week: 3,
        weekdays: MON_THU,
        following: false,
        last: 6,
      }
    );
    expect(back.weeks).toEqual([]);
  });

  it("reads every week as the days most weeks land on, not a week set apart", () => {
    const apart = schedule([
      [1, [1]],
      [2, MON_THU],
    ]);
    expect(usualDays(apart, 1, 4)).toEqual(MON_THU);
    expect(usualDays(schedule([[3, [6]]]), 1, 4)).toEqual(MON_THU);
  });
});

describe("withFollowing and withoutFollowing", () => {
  const before = schedule([
    [3, [1]],
    [5, [6]],
  ]);

  it("carries a week's days through the end of the block", () => {
    expect(weeksOf(withFollowing(before, 3, 6))).toEqual([MON_THU, MON_THU, [1], [1], [1], [1]]);
  });

  it("makes week 1's days the workout's own", () => {
    expect(withFollowing(before, 1, 6)).toEqual({
      membershipId: "m",
      weekdays: MON_THU,
      weeks: [],
    });
  });

  it("puts the weeks after back as they were, keeping the week itself", () => {
    const applied = withWeekDays(withFollowing(before, 3, 6), {
      week: 3,
      weekdays: [2],
      following: true,
      last: 6,
    });
    expect(weeksOf(withoutFollowing(applied, before, 3, 6))).toEqual([
      MON_THU,
      MON_THU,
      [2],
      [1],
      [6],
      [6],
    ]);
  });
});
