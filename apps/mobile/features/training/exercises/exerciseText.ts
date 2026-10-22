import { toUnit, type WeightUnit } from "@sendtally/core/hang";
import { setText } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import type {
  ExerciseMetric,
  ExerciseSeries,
  ExerciseSummary,
} from "@sendtally/features/statistics";
import type { Stat } from "../components/types";

const DASH = "–";

export function loadText(kg: number, unit: WeightUnit): string {
  return t("hang.loadPlain", {
    value: formatNumber(toUnit(kg, unit), { maximumFractionDigits: 1 }),
    unit,
  });
}

/** A value on the exercise's metric, as the chart and sentences show it. */
export function metricText(value: number, metric: ExerciseMetric, unit: WeightUnit): string {
  if (metric === "load") return loadText(value, unit);
  if (metric === "seconds") return `${formatNumber(value)}s`;
  return t("statistics.repsValue", { count: value });
}

export function headlineLabel(metric: ExerciseMetric): string {
  if (metric === "load") return t("statistics.heaviestDone");
  return metric === "seconds" ? t("statistics.longestDone") : t("statistics.mostRepsDone");
}

export function exerciseInsight(
  series: ExerciseSeries,
  summary: ExerciseSummary,
  unit: WeightUnit
): string {
  const first = series.sessions.find((s) => !s.attempted);
  if (first === undefined || summary.best === null)
    return t("statistics.insightAttempted", { set: setText(summary.latest.best, unit) });
  const exercise = series.name;
  const date = shortDate(first.date);
  const change = metricText(Math.abs(summary.change), series.metric, unit);
  const line =
    summary.change > 0
      ? t("statistics.insightUp", { exercise, change, date })
      : summary.change < 0
        ? t("statistics.insightDown", { exercise, change, date })
        : t("statistics.insightHeld", {
            exercise,
            value: metricText(first.value, series.metric, unit),
            date,
          });
  const e1rm =
    summary.e1rmKg === null
      ? ""
      : t("statistics.insightE1rm", { value: loadText(summary.e1rmKg, unit) });
  const sides = series.sessions.filter((s) => s.sides !== null).at(-1)?.sides;
  const split =
    sides?.L === undefined || sides.R === undefined
      ? ""
      : t("statistics.insightSides", {
          left: metricText(sides.L, series.metric, unit),
          right: metricText(sides.R, series.metric, unit),
        });
  return [line, e1rm, split].filter((p) => p !== "").join(" ");
}

export function exerciseStats(
  series: ExerciseSeries,
  summary: ExerciseSummary,
  unit: WeightUnit
): Stat[] {
  return [
    { label: t("statistics.sessions"), value: String(summary.sessions) },
    {
      label: t("statistics.best"),
      value: summary.best === null ? DASH : setText(summary.best.best, unit),
    },
    { label: t("statistics.latest"), value: setText(summary.latest.best, unit) },
    {
      label: t("statistics.volumeThisMonth"),
      value: series.metric === "load" ? loadText(summary.volumeThisMonthKg, unit) : DASH,
    },
  ];
}
