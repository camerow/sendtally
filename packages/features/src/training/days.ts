import type {
  Activity,
  HangSessionRecord,
  PlanItem,
  PlanKind,
  SessionRow,
} from "@sendtally/api-client";
import {
  addDays,
  isDoneOn,
  scheduledOn,
  weekStart,
  weekStreak,
  type CalendarDate,
  type Schedule,
} from "@sendtally/core/hang";
import { planOccurrences, type OccurrenceStatus, type WeekGoal } from "../activities/plan";
import { utcDate } from "../log-session/transforms";
import { isUnscored } from "../sessions/meta";

/** One thing on a training day. `kind` names the discipline, `status` whether it happened. */
export type DayItem =
  | { kind: "climb"; status: "logged"; session: SessionRow }
  | { kind: "hang"; status: "logged"; session: HangSessionRecord }
  | { kind: "hang"; status: "planned"; schedule: Schedule }
  | PlanDayItem;

/** A plan item's occurrence on one day, done, missed or still planned. */
export type PlanDayItem = { kind: PlanKind; status: OccurrenceStatus; plan: PlanItem };

export type DayItemKind = DayItem["kind"];

export type LoggedItem = Extract<DayItem, { status: "logged" }>;

export type PlannedItem = Extract<DayItem, { status: "planned" }>;

export type TrainingDay = {
  date: CalendarDate;
  isToday: boolean;
  isPast: boolean;
  logged: LoggedItem[];
  /** Planned for the day and not logged yet: due today or later, missed before. */
  planned: PlannedItem[];
  plans: PlanDayItem[];
  /** The weekly goals of the day's week, counted rather than marked on a day. */
  goals: WeekGoal[];
};

export type TrainingLog = {
  climbs: readonly SessionRow[];
  hangs: readonly HangSessionRecord[];
  schedules: readonly Schedule[];
  activities: readonly Activity[];
  planItems: readonly PlanItem[];
};

/** A climbing session's calendar day: its wall-clock start is stored as UTC. */
export const climbDate = (session: Pick<SessionRow, "start_at">): CalendarDate =>
  utcDate(session.start_at);

export function trainingDay(
  log: TrainingLog,
  date: CalendarDate,
  today: CalendarDate
): TrainingDay {
  const monday = weekStart(date);
  const calendar = planOccurrences(
    log.planItems,
    log.activities,
    log.climbs.map(climbDate),
    { start: monday, end: addDays(monday, 7) },
    today
  );
  return {
    date,
    isToday: date === today,
    isPast: date < today,
    logged: [
      ...log.climbs
        .filter((s) => climbDate(s) === date)
        .map((session): LoggedItem => ({ kind: "climb", status: "logged", session })),
      ...log.hangs
        .filter((s) => s.date === date)
        .map((session): LoggedItem => ({ kind: "hang", status: "logged", session })),
    ],
    planned: scheduledOn(log.schedules, date)
      .filter((s) => !isDoneOn(log.hangs, s, date))
      .map((schedule) => ({ kind: "hang", status: "planned", schedule })),
    plans: calendar.days
      .filter((o) => o.date === date)
      .map((o) => ({ kind: o.item.kind, status: o.status, plan: o.item })),
    goals: calendar.weeks,
  };
}

/** The seven days from `monday`. */
export function trainingWeek(
  log: TrainingLog,
  monday: CalendarDate,
  today: CalendarDate
): TrainingDay[] {
  return Array.from({ length: 7 }, (_, i) => trainingDay(log, addDays(monday, i), today));
}

export function itemEffort(item: LoggedItem): number | null {
  if (item.kind === "hang") return item.session.rpe;
  return isUnscored(item.session) ? null : item.session.rpe;
}

export type DayMarkSpec = { kind: DayItemKind; filled: boolean };

/**
 * One mark per thing on the day: filled once it happened, outlined while open. A climb
 * plan done adds none, since the climbing session that did it is already logged.
 */
export function dayMarks(day: TrainingDay): DayMarkSpec[] {
  const plans = (status: (s: OccurrenceStatus) => boolean): DayMarkSpec[] =>
    day.plans
      .filter((p) => status(p.status) && !(p.status === "done" && p.kind === "climb"))
      .map((p) => ({ kind: p.kind, filled: p.status === "done" }));
  return [
    ...day.logged.map((i) => ({ kind: i.kind, filled: true })),
    ...plans((s) => s === "done"),
    ...day.planned.map((i) => ({ kind: i.kind, filled: false })),
    ...plans((s) => s !== "done"),
  ];
}

export type WeekStats = { done: number; planned: number; effort: number | null; streak: number };

/**
 * This week so far: what happened against everything planned or done, the mean effort, and
 * the week streak. A weekly goal counts its target; climbing toward one is already logged.
 */
export function weekStats(log: TrainingLog, today: CalendarDate): WeekStats {
  const days = trainingWeek(log, weekStart(today), today);
  const marks = days.flatMap(dayMarks);
  const goals = days[0]?.goals ?? [];
  const met = (g: WeekGoal): number => Math.min(g.done, g.target);
  const done =
    marks.filter((m) => m.filled).length +
    goals.filter((g) => g.item.kind !== "climb").reduce((n, g) => n + met(g), 0);
  const open =
    marks.filter((m) => !m.filled).length + goals.reduce((n, g) => n + g.target - met(g), 0);
  const efforts = days
    .flatMap((d) => d.logged)
    .map(itemEffort)
    .filter((e) => e !== null);
  const dates = [...log.climbs.map((s) => ({ date: climbDate(s) })), ...log.hangs];
  return {
    done,
    planned: done + open,
    effort: efforts.length === 0 ? null : efforts.reduce((a, b) => a + b, 0) / efforts.length,
    streak: weekStreak(dates, today),
  };
}
