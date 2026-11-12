import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { formatNumber, t } from "../i18n";
import type { GradeFormatter } from "../sessions";
import type { ExerciseMetric } from "../statistics";

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
