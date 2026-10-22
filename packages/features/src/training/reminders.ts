import { addDays, type CalendarDate } from "@sendtally/core/hang";
import { t } from "../i18n";
import { trainingDay, type TrainingLog } from "./days";

export const REMINDER_DAYS = 14;

export type TrainingReminder = { date: CalendarDate; at: Date; title: string; body: string };

/** The local moment a reminder fires: "HH:MM" on that calendar day. */
export function reminderMoment(date: CalendarDate, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 8, mm ?? 0);
}

function openItems(log: TrainingLog, date: CalendarDate): string[] {
  return trainingDay(log, date, date)
    .plans.filter((p) => p.status === "planned")
    .flatMap((p) => (p.workout === undefined ? [] : [p.workout.name]));
}

/**
 * One reminder per day from `today` that still has something planned and not yet done,
 * listing it. Moments already past are left out.
 */
export function trainingReminders(
  log: TrainingLog,
  today: CalendarDate,
  time: string,
  now: Date,
  days = REMINDER_DAYS
): TrainingReminder[] {
  return Array.from({ length: days }, (_, i) => addDays(today, i)).flatMap((date) => {
    const items = openItems(log, date);
    const at = reminderMoment(date, time);
    return items.length === 0 || at <= now
      ? []
      : [{ date, at, title: t("hang.reminderTitle"), body: items.join(", ") }];
  });
}
