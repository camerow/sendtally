import type { MembershipDays, Plan } from "@sendtally/api-client";
import type { Membership, Weekday } from "@sendtally/core/hang";

/** A membership's days: its own weekdays, then each block week its days changed from. */
export type DaySchedule = { membershipId: string; weekdays: Weekday[]; weeks: MembershipDays[] };

/** A block membership's day changes, earliest week first. */
export const scheduleOf = (plan: Pick<Plan, "membershipDays">, m: Membership): DaySchedule => ({
  membershipId: m.id,
  weekdays: [...m.weekdays],
  weeks: plan.membershipDays
    .filter((d) => d.membershipId === m.id)
    .sort((a, b) => a.fromWeek - b.fromWeek),
});

/** The weekdays a schedule lands on in one block week: the latest change at or before it. */
export function daysInWeek(schedule: DaySchedule, week: number): Weekday[] {
  const edit = schedule.weeks.filter((d) => d.fromWeek <= week).at(-1);
  return edit === undefined ? schedule.weekdays : edit.weekdays;
}

const same = (a: readonly Weekday[], b: readonly Weekday[]): boolean =>
  a.length === b.length && a.every((d) => b.includes(d));

const sorted = (days: readonly Weekday[]): Weekday[] => [...new Set(days)].sort((a, b) => a - b);

/**
 * The schedule with one week's days set, for that week alone or for it and every week after.
 * Alone, the week after keeps the days it had, up to the block's `last` week. Set from week 1
 * on, they become the workout's own weekdays, the pattern every week runs; a week set alone,
 * week 1 too, only ever sets itself apart. A change repeating the week before it is dropped.
 */
export function withWeekDays(
  schedule: DaySchedule,
  {
    week,
    weekdays,
    following,
    last,
  }: { week: number; weekdays: readonly Weekday[]; following: boolean; last: number }
): DaySchedule {
  const { membershipId } = schedule;
  if (following && week <= 1) return { membershipId, weekdays: sorted(weekdays), weeks: [] };
  const kept = schedule.weeks.filter((d) => d.fromWeek < week || (!following && d.fromWeek > week));
  const keepNext = !following && week < last && !kept.some((d) => d.fromWeek === week + 1);
  const changes = [
    ...kept,
    { membershipId, fromWeek: week, weekdays: sorted(weekdays) },
    ...(keepNext
      ? [{ membershipId, fromWeek: week + 1, weekdays: daysInWeek(schedule, week + 1) }]
      : []),
  ].sort((a, b) => a.fromWeek - b.fromWeek);
  const weeks: MembershipDays[] = [];
  for (const change of changes)
    if (!same(change.weekdays, weeks.at(-1)?.weekdays ?? schedule.weekdays)) weeks.push(change);
  return { membershipId, weekdays: schedule.weekdays, weeks };
}

/** The weeks after `week` with days of their own, which setting it for every week replaces. */
export const ownWeeksAfter = (schedule: DaySchedule, week: number): number[] =>
  schedule.weeks.filter((d) => d.fromWeek > week).map((d) => d.fromWeek);

/** The days most weeks from `from` to `last` land on, the earliest such week's on a tie. */
export function usualDays(schedule: DaySchedule, from: number, last: number): Weekday[] {
  const weeks = Array.from({ length: Math.max(1, last - from + 1) }, (_, i) =>
    daysInWeek(schedule, from + i)
  );
  const count = (days: readonly Weekday[]): number => weeks.filter((w) => same(w, days)).length;
  return weeks.reduce((best, days) => (count(days) > count(best) ? days : best));
}

/** Whether a schedule lands on any day in any week. */
export const hasDays = (schedule: DaySchedule): boolean =>
  schedule.weekdays.length > 0 || schedule.weeks.some((w) => w.weekdays.length > 0);

/** A day change as a tap makes it: a week's day on or off, alone or from it on. */
export type DayToggle = {
  week: number;
  day: Weekday;
  following: boolean;
  last: number;
  /** On or off the days most weeks from `week` land on, for it and every week after. */
  every?: boolean;
};

/** The schedule with one day turned on or off. */
export function toggleDay(
  schedule: DaySchedule,
  { week, day, following, last, every = false }: DayToggle
): DaySchedule {
  const days = every ? usualDays(schedule, week, last) : daysInWeek(schedule, week);
  return withWeekDays(schedule, {
    week,
    weekdays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    following: following || every,
    last,
  });
}
