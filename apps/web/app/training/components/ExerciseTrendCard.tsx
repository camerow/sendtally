import React from "react";
import { fromUnit, toUnit, type WeightUnit, chartAir } from "@sendtally/core/hang";
import { headlineLabel, metricText, volumeLine } from "@sendtally/features/exercises";
import { shortDate, weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { ExerciseMetric, ExerciseSeries } from "@sendtally/features/statistics";
import { SeriesChart } from "./SeriesChart";

const AIR = {
  load: 2,
  seconds: 5,
  reps: 1,
  sends: 1,
  climbs: 1,
  averageGrade: 1,
  topGrade: 1,
  volume: 2,
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
  const made = volumeLine(latest, series.grades);
  const text = (v: number): string =>
    load ? weightText(v, unit) : metricText(v, series.metric, unit, series.grades);
  return (
    <div className="trend-card">
      <div className="trend-card-head">
        <span className="train-label">{headlineLabel(series.metric)}</span>
        <span className="trend-card-name">{series.name}</span>
      </div>
      <span className="train-title trend-card-value">{text(latest.value)}</span>
      {made !== null && <span className="trend-card-name">{made}</span>}
      <SeriesChart
        values={series.sessions.map((s) => (load ? toUnit(s.value, unit) : s.value))}
        air={load ? chartAir(unit) : AIR[series.metric]}
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
