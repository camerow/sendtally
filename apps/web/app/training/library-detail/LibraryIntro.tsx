import React from "react";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { focusBeside, KIND_LOOK } from "@sendtally/features/training";
import { workoutMinutes, type LibraryWorkout, type WorkoutUse } from "@sendtally/features/workouts";
import { CategoryMark } from "../components/CategoryMark";

export type LibraryIntroProps = { workout: LibraryWorkout; use: WorkoutUse | undefined };

/** A workout's kicker (kind and focus), name, what it is for, and its length, effort and use. */
export function LibraryIntro({ workout, use }: LibraryIntroProps): React.ReactElement {
  const count = use?.count ?? 0;
  const minutes = workoutMinutes(workout, count);
  const kind = kindLabel(workout.kind);
  const meta = [
    ...(minutes === null ? [] : [durationLabel(minutes)]),
    ...(workout.targetRpe === null ? [] : [t("plan.targetValue", { n: workout.targetRpe })]),
    count === 0 ? t("workouts.notUsed") : t("workouts.usedTimes", { count }),
  ].join(" · ");
  return (
    <div className="intro">
      <span className="intro-kicker">
        <CategoryMark kind={workout.kind} size={28} />
        <span className="train-label" style={{ color: KIND_LOOK[workout.kind].ink }}>
          {[kind, ...focusBeside(kind, workout.focus)].join(" · ")}
        </span>
      </span>
      <h1 className="train-title intro-title">{workout.name}</h1>
      {workout.description !== "" && <p className="intro-body">{workout.description}</p>}
      <span className="intro-meta">{meta}</span>
    </div>
  );
}
