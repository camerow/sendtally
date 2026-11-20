import React from "react";
import { kindLabel } from "@sendtally/features/activities";
import { focusBeside, KIND_LOOK } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { CategoryMark } from "../components/CategoryMark";
import { Description } from "../components/Description";

export type LibraryIntroProps = {
  workout: LibraryWorkout;
  /** In place of the kind's kicker, such as the block a planned run is in. */
  kicker?: string;
  /** Under the name, such as a planned run's day. */
  day?: React.ReactNode;
};

/** A workout's kicker (kind and focus), name, its day when planned, and what it is for. */
export function LibraryIntro({ workout, kicker, day }: LibraryIntroProps): React.ReactElement {
  const kind = kindLabel(workout.kind);
  return (
    <div className="intro">
      <span className="intro-kicker">
        <CategoryMark kind={workout.kind} size={28} />
        <span className="train-label" style={{ color: KIND_LOOK[workout.kind].ink }}>
          {kicker ?? [kind, ...focusBeside(kind, workout.focus)].join(" · ")}
        </span>
      </span>
      <h1 className="train-title intro-title">{workout.name}</h1>
      {day}
      <Description text={workout.description} fold />
    </div>
  );
}
