import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { setText } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { GradeFormatter } from "@sendtally/features/sessions";
import {
  isGradeMetric,
  type ExerciseMetric,
  type ExerciseSeries,
  type ExerciseSession,
  type ExerciseSummary,
} from "@sendtally/features/statistics";
import type { Stat } from "../components/types";

const DASH = "–";

export function loadText(kg: number, unit: WeightUnit): string {
  return t("hang.loadPlain", {
    value: formatNumber(toUnit(kg, unit), { maximumFractionDigits: 1 }),
    unit,
  });
}

/** A value on the exercise's metric, as the chart and sentences show it; a grade reads on `grades`. */
export function metricText(
  value: number,
  metric: ExerciseMetric,
  unit: WeightUnit,
  grades?: GradeFormatter
): string {
  if (metric === "topGrade" && grades !== undefined) return grades.label(value);
  if (metric === "averageGrade" && grades !== undefined) return grades.average(value);
  if (metric === "load") return loadText(value, unit);
  if (metric === "seconds") return `${formatNumber(value)}s`;
  if (metric === "sends") return t("tally.sentCount", { count: value });
  if (metric === "laps") return t("tally.lapCount", { count: value });
  return t("statistics.repsValue", { count: value });
}

/** "1 grade", "0.4 grades": how far a grade moved, whatever the scale. */
export function gradesText(by: number): string {
  const steps = Math.round(Math.abs(by) * 10) / 10;
  return t("trends.deltaGrades", {
    count: steps,
    n: formatNumber(steps, { maximumFractionDigits: 1 }),
  });
}

export function headlineLabel(metric: ExerciseMetric): string {
  if (metric === "topGrade") return t("trends.hardestSend");
  if (metric === "averageGrade") return t("trends.avgSendGrade");
  if (metric === "load") return t("statistics.heaviestDone");
  if (metric === "sends") return t("common.sent");
  if (metric === "laps") return t("summary.laps");
  return metric === "seconds" ? t("statistics.longestDone") : t("statistics.mostRepsDone");
}

export function exerciseInsight(
  series: ExerciseSeries,
  summary: ExerciseSummary,
  unit: WeightUnit
): string {
  const [first] = series.sessions;
  if (first === undefined || summary.best === null)
    return t("statistics.insightAttempted", { set: setText(summary.latest.best, unit) });
  const exercise = series.name;
  const date = shortDate(first.date);
  const change = isGradeMetric(series.metric)
    ? gradesText(summary.change)
    : metricText(Math.abs(summary.change), series.metric, unit);
  const line =
    summary.change > 0
      ? t("statistics.insightUp", { exercise, change, date })
      : summary.change < 0
        ? t("statistics.insightDown", { exercise, change, date })
        : t("statistics.insightHeld", {
            exercise,
            value: metricText(first.value, series.metric, unit, series.grades),
            date,
          });
  const e1rm =
    summary.e1rmKg === null
      ? ""
      : t("statistics.insightE1rm", { value: loadText(summary.e1rmKg, unit) });
  return [line, e1rm].filter((p) => p !== "").join(" ");
}

export function exerciseStats(
  series: ExerciseSeries,
  summary: ExerciseSummary,
  unit: WeightUnit
): Stat[] {
  const shown = (s: ExerciseSession): string =>
    isGradeMetric(series.metric)
      ? metricText(s.value, series.metric, unit, series.grades)
      : setText(s.best, unit);
  return [
    { label: t("statistics.sessions"), value: String(summary.sessions) },
    { label: t("statistics.best"), value: summary.best === null ? DASH : shown(summary.best) },
    { label: t("statistics.latest"), value: shown(summary.latest) },
    {
      label: t("statistics.volumeThisMonth"),
      value: series.metric === "load" ? loadText(summary.volumeThisMonthKg, unit) : DASH,
    },
  ];
}
