import { describe, expect, it } from "vitest";
import type { Weekday } from "@sendtally/core/hang";
import { daysInWeek, ownWeeksAfter, usualDays, withWeekDays, type DaySchedule } from "./weekDays";

const MON_THU: Weekday[] = [0, 3];
const schedule = (weeks: [number, Weekday[]][] = []): DaySchedule => ({
  membershipId: "m",
  weekdays: MON_THU,
  weeks: weeks.map(([fromWeek, weekdays]) => ({ membershipId: "m", fromWeek, weekdays })),
});
const weeksOf = (s: DaySchedule, last = 6): Weekday[][] =>
  Array.from({ length: last }, (_, i) => daysInWeek(s, i + 1));

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

  it("makes a change from week 1 the workout's own days, and drops changes that repeat", () => {
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
