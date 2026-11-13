import React from "react";
import { fromUnit, toUnit, type WeightUnit } from "@sendtally/core/hang";
import { headlineLabel, loadText, metricText } from "@sendtally/features/exercises";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { ExerciseMetric, ExerciseSeries } from "@sendtally/features/statistics";
import { SeriesChart } from "./SeriesChart";

const AIR = {
  load: 2,
  seconds: 5,
  reps: 1,
  sends: 1,
  laps: 1,
  averageGrade: 1,
  topGrade: 1,
} as const satisfies Record<ExerciseMetric, number>;

export type ExerciseTrendCardProps = { series: ExerciseSeries; unit: WeightUnit };

/** One exercise over time: the best set per session. */
export function ExerciseTrendCard({
  series,
  unit,
}: ExerciseTrendCardProps): React.ReactElement | null {
  const first = series.sessions[0];
  const latest = series.sessions.at(-1);
  if (first === undefined || latest === undefined) return null;
  const load = series.metric === "load";
  const text = (v: number): string =>
    load ? loadText(v, unit) : metricText(v, series.metric, unit, series.grades);
  return (
    <div className="trend-card">
      <div className="trend-card-head">
        <span className="train-label">{headlineLabel(series.metric)}</span>
        <span className="trend-card-name">{series.name}</span>
      </div>
      <span className="train-title trend-card-value">{text(latest.value)}</span>
      <SeriesChart
        values={series.sessions.map((s) => (load ? toUnit(s.value, unit) : s.value))}
        air={load ? (unit === "lb" ? 4 : 2) : AIR[series.metric]}
        edge={(v) => text(load ? fromUnit(v, unit) : v)}
        label={t("statistics.exerciseChart", {
          exercise: series.name,
          from: text(first.value),
          to: text(latest.value),
        })}
      />
      <div className="trend-card-foot train-label">
        <span>{shortDate(first.date)}</span>
        <span>{t("statistics.exerciseSessions", { count: series.sessions.length })}</span>
      </div>
      <span className="trend-legends">
        <span className="trend-legend">{t("statistics.legendDone")}</span>
      </span>
    </div>
  );
}
