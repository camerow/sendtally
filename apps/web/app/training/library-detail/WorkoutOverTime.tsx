import React from "react";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExerciseSeries } from "@sendtally/features/statistics";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { useAppApi } from "../../lib/useAppApi";
import { ExerciseTrendCard } from "../components/ExerciseTrendCard";

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
  if (lead === undefined || lead.sessions.length === 0) return null;
  return (
    <section className="detail-section">
      <SectionHeading title={t("summary.overTime")} />
      <ExerciseTrendCard series={lead} unit={unit} />
    </section>
  );
}
