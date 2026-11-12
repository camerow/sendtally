import React from "react";
import { fromUnit, toUnit } from "@sendtally/core/hang";
import { useWeightUnit } from "@sendtally/features/activities";
import { headlineLabel, loadText, metricText } from "@sendtally/features/exercises";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  useExerciseSeries,
  type ExerciseMetric,
} from "@sendtally/features/statistics";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { useAppApi } from "../../lib/useAppApi";
import { SeriesChart } from "../components/SeriesChart";

const AIR = {
  load: 2,
  seconds: 5,
  reps: 1,
  sends: 1,
  laps: 1,
  averageGrade: 1,
  topGrade: 1,
} as const satisfies Record<ExerciseMetric, number>;

/** How a workout is going: its lead exercise's best set per session. */
export function WorkoutOverTime({
  workout,
}: {
  workout: LibraryWorkout;
}): React.ReactElement | null {
  const api = useAppApi();
  const series = useExerciseSeries(api);
  const unit = useWeightUnit(api);
  if (series.status !== "ready") return null;
  const lead = workout.items
    .map((i) => series.data.find((s) => s.key === exerciseKey(i.exercise) && s.untracked !== true))
    .find((s) => s !== undefined);
  const first = lead?.sessions[0];
  const latest = lead?.sessions.at(-1);
  if (lead === undefined || first === undefined || latest === undefined) return null;
  const load = lead.metric === "load";
  const text = (v: number): string =>
    load ? loadText(v, unit) : metricText(v, lead.metric, unit, lead.grades);
  return (
    <section className="detail-section">
      <SectionHeading title={t("summary.overTime")} />
      <div className="trend-card">
        <div className="trend-card-head">
          <span className="train-label">{headlineLabel(lead.metric)}</span>
          <span className="trend-card-name">{lead.name}</span>
        </div>
        <span className="train-title trend-card-value">{text(latest.value)}</span>
        <SeriesChart
          values={lead.sessions.map((s) => (load ? toUnit(s.value, unit) : s.value))}
          air={load ? (unit === "lb" ? 4 : 2) : AIR[lead.metric]}
          edge={(v) => text(load ? fromUnit(v, unit) : v)}
          label={t("statistics.exerciseChart", {
            exercise: lead.name,
            from: text(first.value),
            to: text(latest.value),
          })}
        />
        <div className="trend-card-foot train-label">
          <span>{shortDate(first.date)}</span>
          <span>{t("statistics.exerciseSessions", { count: lead.sessions.length })}</span>
        </div>
        <span className="trend-legend">{t("statistics.legendDone")}</span>
      </div>
    </section>
  );
}
