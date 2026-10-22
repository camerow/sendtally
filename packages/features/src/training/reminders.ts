import { addDays, type CalendarDate } from "@sendtally/core/hang";
import type { HangModel } from "../hang/model";
import { t } from "../i18n";
import { trainingDay, type TrainingLog } from "./days";

export const REMINDER_DAYS = 14;

export type TrainingReminder = { date: CalendarDate; at: Date; title: string; body: string };

export type ReminderNames = Pick<HangModel, "workout" | "gripName">;

/** The local moment a reminder fires: "HH:MM" on that calendar day. */
export function reminderMoment(date: CalendarDate, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 8, mm ?? 0);
}

function openItems(log: TrainingLog, names: ReminderNames, date: CalendarDate): string[] {
  const day = trainingDay(log, date, date);
  return [
    ...day.planned.map(({ schedule }) => {
      const workout = names.workout(schedule.workoutId)?.name ?? t("training.hangboard");
      return `${workout} · ${names.gripName(schedule.gripId)}`;
    }),
    ...day.plans.filter((p) => p.status === "planned").map((p) => p.plan.title),
  ];
}

/**
 * One reminder per day from `today` that still has something planned and not yet done,
 * listing it. Skipped dates drop out with their occurrences, and moments already past
 * are left out.
 */
export function trainingReminders(
  log: TrainingLog,
  names: ReminderNames,
  today: CalendarDate,
  time: string,
  now: Date,
  days = REMINDER_DAYS
): TrainingReminder[] {
  return Array.from({ length: days }, (_, i) => addDays(today, i)).flatMap((date) => {
    const items = openItems(log, names, date);
    const at = reminderMoment(date, time);
    return items.length === 0 || at <= now
      ? []
      : [{ date, at, title: t("hang.reminderTitle"), body: items.join(", ") }];
  });
}
