import { t } from "@sendtally/features/i18n";
import { dayMarks, type TrainingDay } from "@sendtally/features/training";

/** "2 planned · 1 done", or only what was done once the day is past. */
export function daySummary(day: TrainingDay): string {
  const marks = dayMarks(day);
  const done = t("hang.doneCount", { n: marks.filter((m) => m.filled).length });
  if (day.isPast) return done;
  const open = marks.filter((m) => !m.filled).length;
  const planned = t("hang.plannedCount", { n: open });
  return open === marks.length ? planned : `${planned} · ${done}`;
}
