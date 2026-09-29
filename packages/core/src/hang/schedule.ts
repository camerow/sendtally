import { addDays, daysBetween, weekday } from "./calendar";
import type { CalendarDate, HangSession, Schedule } from "./types";

const MAX_OCCURRENCES = 400;

export function occursOn(
  s: Omit<Schedule, "id" | "workoutId" | "gripId">,
  d: CalendarDate
): boolean {
  return (
    d >= s.start &&
    (s.end === null || d < s.end) &&
    s.days.includes(weekday(d)) &&
    !s.skip.includes(d)
  );
}

/** Every date the schedule lands on, capped for ongoing ones. */
export function occurrences(s: Omit<Schedule, "id" | "workoutId" | "gripId">): CalendarDate[] {
  const out: CalendarDate[] = [];
  if (s.days.length === 0) return out;
  for (
    let d = s.start;
    (s.end === null || d < s.end) && out.length < MAX_OCCURRENCES;
    d = addDays(d, 1)
  )
    if (occursOn(s, d)) out.push(d);
  return out;
}

export type EndChoice =
  { mode: "never" } | { mode: "weeks"; weeks: number } | { mode: "date"; last: CalendarDate };

export function endOf(start: CalendarDate, choice: EndChoice): CalendarDate | null {
  if (choice.mode === "never") return null;
  if (choice.mode === "weeks") return addDays(start, choice.weeks * 7);
  return addDays(choice.last, 1);
}

/** Recovers the planner's choice from a stored schedule. */
export function endChoiceOf(s: Pick<Schedule, "start" | "end">): EndChoice {
  if (s.end === null) return { mode: "never" };
  const days = daysBetween(s.start, s.end);
  return days % 7 === 0
    ? { mode: "weeks", weeks: days / 7 }
    : { mode: "date", last: addDays(s.end, -1) };
}

/** Length of the block in weeks, or null when ongoing. */
export function blockWeeks(s: Pick<Schedule, "start" | "end">): number | null {
  return s.end === null ? null : Math.ceil(daysBetween(s.start, s.end) / 7);
}

export function weekOfBlock(s: Pick<Schedule, "start">, d: CalendarDate): number {
  return Math.floor(daysBetween(s.start, d) / 7) + 1;
}

export function isLive(s: Pick<Schedule, "end">, today: CalendarDate): boolean {
  return s.end === null || s.end > today;
}

export function isDoneOn(sessions: readonly HangSession[], s: Schedule, d: CalendarDate): boolean {
  return sessions.some((x) => x.date === d && x.workoutId === s.workoutId && x.gripId === s.gripId);
}

export type PlanStatus =
  | { kind: "starts"; date: CalendarDate }
  | { kind: "ongoing" }
  | { kind: "week"; at: number; of: number }
  | { kind: "final"; of: number };

export function planStatus(s: Schedule, today: CalendarDate): PlanStatus {
  if (s.start > today) return { kind: "starts", date: s.start };
  const of = blockWeeks(s);
  if (of === null) return { kind: "ongoing" };
  const at = weekOfBlock(s, today);
  return at >= of ? { kind: "final", of } : { kind: "week", at, of };
}

export function liveSchedules(
  schedules: readonly Schedule[],
  today: CalendarDate,
  workoutId?: string
): Schedule[] {
  return schedules
    .filter((s) => isLive(s, today) && (workoutId === undefined || s.workoutId === workoutId))
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

export function scheduledOn(schedules: readonly Schedule[], d: CalendarDate): Schedule[] {
  return schedules.filter((s) => occursOn(s, d));
}

export type DayState = { trained: boolean; planned: boolean; missed: boolean };

export function dayState(
  schedules: readonly Schedule[],
  sessions: readonly HangSession[],
  d: CalendarDate,
  today: CalendarDate
): DayState {
  const planned = scheduledOn(schedules, d);
  return {
    trained: sessions.some((x) => x.date === d),
    planned: planned.length > 0,
    missed: d < today && planned.some((s) => !isDoneOn(sessions, s, d)),
  };
}
