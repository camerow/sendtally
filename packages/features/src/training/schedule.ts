import {
  blockWeekOn,
  maxDate,
  weekday,
  type Block,
  type CalendarDate,
  type Membership,
  type Weekday,
} from "@sendtally/core/hang";
import { daysList, shortDate } from "../hang/format";
import { t } from "../i18n";
import { daysInWeek, withWeekDays, type DaySchedule } from "./weekDays";

/** Every week on some weekdays, or once on each of some dates. */
export type ScheduleMode = "repeat" | "dates";

export type ScheduleDraft = {
  mode: ScheduleMode;
  weekdays: Weekday[];
  dates: CalendarDate[];
  /** Where a weekly plan starts. */
  start: CalendarDate;
};

/** A new schedule, opened from a day: that weekday every week, or that date alone. */
export function newSchedule(date: CalendarDate | null, today: CalendarDate): ScheduleDraft {
  const from = date === null ? today : maxDate(date, today);
  return {
    mode: "repeat",
    weekdays: date === null ? [] : [weekday(date)],
    dates: date === null || date < today ? [] : [date],
    start: from,
  };
}

const ascending = <T extends string | number>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

/** The list with `x` added, or taken out when it was there, in order. */
export function toggled<T extends string | number>(list: readonly T[], x: T): T[] {
  return list.includes(x) ? list.filter((y) => y !== x) : [...list, x].sort(ascending);
}

/** Whether the schedule says when: some weekdays, or some dates. */
export function scheduleReady(d: ScheduleDraft): boolean {
  return d.mode === "repeat" ? d.weekdays.length > 0 : d.dates.length > 0;
}

/**
 * What adding the workout on the schedule saves, outside any block: one plan on its weekdays,
 * or a one-off plan per date. `newId` hands out the id of each.
 */
export function scheduledMemberships(
  d: ScheduleDraft,
  workoutId: string,
  newId: () => string,
  position: number
): Membership[] {
  const plan = { workoutId, blockId: null, position };
  if (d.mode === "repeat")
    return [{ ...plan, id: newId(), weekdays: [...d.weekdays].sort(ascending), start: d.start }];
  return [...d.dates]
    .sort(ascending)
    .map((date) => ({ ...plan, id: newId(), weekdays: [], start: date }));
}

/** A block plan's days on some dates: each date's weekday in its week alone. */
export function blockDates(
  membershipId: string,
  block: Block,
  dates: readonly CalendarDate[]
): DaySchedule {
  return dates.reduce(
    (schedule, date) => {
      const week = blockWeekOn(block, date);
      if (week === null) return schedule;
      const days = daysInWeek(schedule, week);
      return withWeekDays(schedule, {
        week,
        weekdays: [...days, weekday(date)],
        following: false,
        last: block.weeks,
      });
    },
    { membershipId, weekdays: [], weeks: [] } as DaySchedule
  );
}

/** The schedule page's Add: every week on the days picked, or on the one date or the count of them. */
export function scheduleAddLabel(
  d: ScheduleDraft,
  count: number,
  first: string | undefined
): string {
  if (d.mode === "repeat")
    return d.weekdays.length === 0
      ? t("hang.add")
      : t("plan.addEvery", { days: daysList(d.weekdays) });
  if (count === 1 && first !== undefined) return t("plan.addOn", { date: shortDate(first) });
  return count === 0 ? t("hang.add") : t("plan.addOnDays", { count });
}
