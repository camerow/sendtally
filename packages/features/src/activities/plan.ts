import type { Activity, PlanItem } from "@sendtally/api-client";
import { addDays, occursOn, weekStart, type CalendarDate } from "@sendtally/core/hang";

/** Past and not done is missed; today and later, not done yet, is planned. */
export type OccurrenceStatus = "done" | "missed" | "planned";

/** One date a weekday plan item lands on. */
export type DayOccurrence = { item: PlanItem; date: CalendarDate; status: OccurrenceStatus };

/** One week of a `perWeek` plan item: `done` counts the days in it that fulfilled the item. */
export type WeekGoal = {
  item: PlanItem;
  week: CalendarDate;
  target: number;
  done: number;
  status: OccurrenceStatus;
};

export type PlanCalendar = { days: DayOccurrence[]; weeks: WeekGoal[] };

/** `end` is exclusive, like a plan item's. */
export type DateRange = { start: CalendarDate; end: CalendarDate };

type Logged = Pick<Activity, "date" | "kind" | "planItemId">;

/** Session RPE: minutes times effort. Null when the effort was not given. */
export function trainingLoad(activity: Pick<Activity, "minutes" | "rpe">): number | null {
  return activity.rpe === null ? null : activity.minutes * activity.rpe;
}

/**
 * Logged against the item that day, or for a climb any climbing session that
 * day, or for anything else any activity of the same kind that day.
 */
function fulfils(
  item: PlanItem,
  date: CalendarDate,
  byDate: ReadonlyMap<CalendarDate, readonly Logged[]>,
  climbingDates: ReadonlySet<CalendarDate>
): boolean {
  if (item.kind === "climb" && climbingDates.has(date)) return true;
  return (byDate.get(date) ?? []).some((a) => a.planItemId === item.id || a.kind === item.kind);
}

const statusOf = (done: boolean, past: boolean): OccurrenceStatus =>
  done ? "done" : past ? "missed" : "planned";

/**
 * Every planned occurrence in `range`: dates for weekday items, weeks (Monday
 * starts) for `perWeek` items. A weekly goal ignores `skip`.
 */
export function planOccurrences(
  items: readonly PlanItem[],
  activities: readonly Logged[],
  climbingDates: readonly CalendarDate[],
  range: DateRange,
  today: CalendarDate
): PlanCalendar {
  const byDate = new Map<CalendarDate, Logged[]>();
  for (const a of activities) byDate.set(a.date, [...(byDate.get(a.date) ?? []), a]);
  const climbed = new Set(climbingDates);
  const inItem = (item: PlanItem, d: CalendarDate): boolean =>
    d >= item.start && (item.end === null || d < item.end);

  const days: DayOccurrence[] = [];
  const weeks: WeekGoal[] = [];
  for (let d = range.start; d < range.end; d = addDays(d, 1)) {
    for (const item of items) {
      if (item.perWeek !== null || !occursOn(item, d)) continue;
      days.push({ item, date: d, status: statusOf(fulfils(item, d, byDate, climbed), d < today) });
    }
  }
  for (let w = weekStart(range.start); w < range.end; w = addDays(w, 7)) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(w, i));
    for (const item of items) {
      if (item.perWeek === null) continue;
      const active = week.filter((d) => inItem(item, d));
      if (active.length === 0) continue;
      const done = active.filter((d) => fulfils(item, d, byDate, climbed)).length;
      const target = item.perWeek;
      weeks.push({
        item,
        week: w,
        target,
        done,
        status: statusOf(done >= target, addDays(w, 7) <= today),
      });
    }
  }
  return { days, weeks };
}
