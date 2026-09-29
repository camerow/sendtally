import {
  addDays,
  isDoneOn,
  scheduledOn,
  type CalendarDate,
  type HangSession,
  type Schedule,
} from "@sendtally/core/hang";

export const REMINDER_DAYS = 14;

export type Reminder = { date: CalendarDate; scheduleIds: string[] };

/**
 * One reminder per upcoming day that still has a scheduled workout to do.
 * Skipped dates, removed schedules and sessions already logged drop out
 * because they are not in what this reads.
 */
export function reminderPlan(
  schedules: readonly Schedule[],
  sessions: readonly HangSession[],
  today: CalendarDate,
  days = REMINDER_DAYS
): Reminder[] {
  return Array.from({ length: days }, (_, i) => addDays(today, i)).flatMap((date) => {
    const due = scheduledOn(schedules, date).filter((s) => !isDoneOn(sessions, s, date));
    return due.length === 0 ? [] : [{ date, scheduleIds: due.map((s) => s.id) }];
  });
}

/** The local moment a reminder fires: "HH:MM" on that calendar day. */
export function reminderMoment(date: CalendarDate, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 8, mm ?? 0);
}
