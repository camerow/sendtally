import type { HangSessionRecord, SessionRow } from "@sendtally/api-client";
import {
  addDays,
  isDoneOn,
  scheduledOn,
  weekStart,
  weekStreak,
  type CalendarDate,
  type Schedule,
} from "@sendtally/core/hang";
import { utcDate } from "../log-session/transforms";
import { isUnscored } from "../sessions/meta";

/** One thing on a training day. `kind` names the discipline, `status` whether it happened. */
export type DayItem =
  | { kind: "climb"; status: "logged"; session: SessionRow }
  | { kind: "hang"; status: "logged"; session: HangSessionRecord }
  | { kind: "hang"; status: "planned"; schedule: Schedule };

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
};

export type TrainingLog = {
  climbs: readonly SessionRow[];
  hangs: readonly HangSessionRecord[];
  schedules: readonly Schedule[];
};

/** A climbing session's calendar day: its wall-clock start is stored as UTC. */
export const climbDate = (session: Pick<SessionRow, "start_at">): CalendarDate =>
  utcDate(session.start_at);

export function trainingDay(
  log: TrainingLog,
  date: CalendarDate,
  today: CalendarDate
): TrainingDay {
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

export type WeekStats = { done: number; planned: number; effort: number | null; streak: number };

/** This week so far: logged against everything planned or logged, the mean effort, and the week streak. */
export function weekStats(log: TrainingLog, today: CalendarDate): WeekStats {
  const days = trainingWeek(log, weekStart(today), today);
  const logged = days.flatMap((d) => d.logged);
  const open = days.reduce((n, d) => n + d.planned.length, 0);
  const efforts = logged.map(itemEffort).filter((e) => e !== null);
  const dates = [...log.climbs.map((s) => ({ date: climbDate(s) })), ...log.hangs];
  return {
    done: logged.length,
    planned: logged.length + open,
    effort: efforts.length === 0 ? null : efforts.reduce((a, b) => a + b, 0) / efforts.length,
    streak: weekStreak(dates, today),
  };
}
