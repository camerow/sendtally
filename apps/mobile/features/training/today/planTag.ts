import { blockWeeks, weekOfBlock, type CalendarDate, type Schedule } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";

/** "Hangboard · week 1 of 4" for a block with an end, just the label for an ongoing one. */
export function planTag(label: string, schedule: Schedule, date: CalendarDate): string {
  const of = blockWeeks(schedule);
  return of === null ? label : t("hang.blockWeek", { label, at: weekOfBlock(schedule, date), of });
}
