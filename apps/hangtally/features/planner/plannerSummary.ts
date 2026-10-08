import { totalSeconds, type CalendarDate, type Workout } from "@sendtally/core/hang";
import { daysList, humanDuration, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export type SummaryInput = {
  workout: Workout | undefined;
  grips: number;
  days: readonly number[];
  dates: readonly CalendarDate[];
  ongoing: boolean;
};

/** The planner's one-line summary, in order of what is still missing. */
export function plannerSummary({ workout, grips, days, dates, ongoing }: SummaryInput): string {
  if (workout === undefined) return t("hang.summaryPickWorkout");
  if (grips === 0) return t("hang.summaryPickGrip");
  if (days.length === 0) return t("hang.summaryPickDay");
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === undefined || last === undefined) return t("hang.summaryNoDates");
  const prefix = grips > 1 ? t("hang.summaryWorkouts", { n: grips }) : "";
  if (ongoing)
    return t("hang.summaryOngoing", {
      prefix,
      days: daysList(days),
      date: shortDate(first),
      duration: humanDuration(totalSeconds(workout)),
    });
  const vars = { prefix, count: dates.length, from: shortDate(first), to: shortDate(last) };
  return grips > 1 ? t("hang.summaryBlockEach", vars) : t("hang.summaryBlock", vars);
}
