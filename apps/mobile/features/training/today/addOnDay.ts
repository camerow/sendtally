import { weekday, type CalendarDate } from "@sendtally/core/hang";
import { weekdayShort } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

/** "Add to today", or "Add to Thu" on any other day. */
export const addOnDayLabel = (date: CalendarDate, today: CalendarDate): string =>
  date === today ? t("plan.addToToday") : t("plan.addToDay", { day: weekdayShort(weekday(date)) });
