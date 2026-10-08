import type { HangSessionRecord } from "@sendtally/api-client";
import {
  addDays,
  isDoneOn,
  plannedWork,
  scheduledOn,
  weekStart,
  weekStreak,
  type CalendarDate,
  type Schedule,
} from "@sendtally/core/hang";

export type ScheduleDay = {
  date: CalendarDate;
  isToday: boolean;
  isPast: boolean;
  logged: HangSessionRecord[];
  /** Planned for the day and not yet logged. */
  pending: Schedule[];
};

export function scheduleDay(
  schedules: readonly Schedule[],
  sessions: readonly HangSessionRecord[],
  date: CalendarDate,
  today: CalendarDate
): ScheduleDay {
  return {
    date,
    isToday: date === today,
    isPast: date < today,
    logged: sessions.filter((s) => s.date === date),
    pending: scheduledOn(schedules, date).filter((s) => !isDoneOn(sessions, s, date)),
  };
}

export type ScheduleStats = { streak: number; done: number; planned: number; hangSeconds: number };

export function scheduleStats(
  schedules: readonly Schedule[],
  sessions: readonly HangSessionRecord[],
  today: CalendarDate
): ScheduleStats {
  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = addDays(monday, 6);
  const done = sessions.filter((s) => s.date >= monday && s.date <= sunday).length;
  const planned = week.reduce((n, d) => n + scheduledOn(schedules, d).length, 0);
  const month = today.slice(0, 7);
  const hangSeconds = sessions
    .filter((s) => s.date.startsWith(month) && s.protocol.kind === "hang")
    .reduce((sum, s) => sum + (plannedWork(s.protocol) * s.pct) / 100, 0);
  return {
    streak: weekStreak(sessions, today),
    done,
    planned: Math.max(done, planned),
    hangSeconds: Math.round(hangSeconds),
  };
}
