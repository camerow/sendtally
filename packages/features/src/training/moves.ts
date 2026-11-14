import {
  addDays,
  blockEnd,
  isDated,
  weekStart,
  type CalendarDate,
  type PlanChange,
} from "@sendtally/core/hang";
import type { Plan } from "@sendtally/api-client";
import { daysList } from "../hang/format";
import { t } from "../i18n";
import type { Occurrence } from "./plan";
import { daysInWeek, scheduleOf } from "./weekDays";

/** The day a run was planned on: where a move came from, else the day it is. */
export const plannedOn = (o: Occurrence): CalendarDate => o.movedFrom ?? o.date;

/** The days a planned run can move among: its block week, or outside a block its calendar week. */
export function moveWeek(o: Occurrence): CalendarDate[] {
  const from =
    o.block !== null && isDated(o.block) && o.week !== null
      ? addDays(o.block.start, (o.week - 1) * 7)
      : weekStart(plannedOn(o));
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}

/**
 * Whether a run can move to a day of its week: today or later, inside its block, not where it
 * already is, and not onto a day that already has the same workout.
 */
export function canMoveTo(
  o: Occurrence,
  d: CalendarDate,
  today: CalendarDate,
  plansOn: (d: CalendarDate) => readonly Occurrence[]
): boolean {
  if (d < today || d === o.date) return false;
  if (o.block !== null && isDated(o.block) && (d < o.block.start || d >= blockEnd(o.block)))
    return false;
  return !plansOn(d).some(
    (p) => p.membership.workoutId === o.membership.workoutId && p.status !== "moved"
  );
}

/** A planned run moved to a day, kept against the day it was planned on. */
export const moveOf = (o: Occurrence, to: CalendarDate): PlanChange => ({
  membershipId: o.membership.id,
  plannedOn: plannedOn(o),
  kind: "move",
  movedTo: to,
  reason: null,
  note: null,
});

/**
 * What a move leaves alone, said under the calendar: the days the plan keeps next week, or
 * that the block's later weeks stay put. Nothing for a one-off, which has no next week.
 */
export function moveCopy(o: Occurrence, plan: Pick<Plan, "membershipDays">): string | null {
  if (o.week === null)
    return o.membership.weekdays.length === 0
      ? null
      : t("plan.moveCopy", { days: daysList(o.membership.weekdays) });
  const next = daysInWeek(scheduleOf(plan, o.membership), o.week + 1);
  const dated = o.block !== null && isDated(o.block) ? o.block : null;
  return next.length === 0 || (dated !== null && o.week >= dated.weeks)
    ? t("plan.moveCopyBlockOnly", { n: o.week })
    : t("plan.moveCopyBlock", { next: o.week + 1, days: daysList(next), n: o.week });
}
