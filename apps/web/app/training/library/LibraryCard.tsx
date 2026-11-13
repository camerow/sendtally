import React from "react";
import { Link } from "react-router";
import {
  doseProtocol,
  intervalPhases,
  intervalsOf,
  phasesFor,
  sessionItems,
} from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { KIND_LOOK } from "@sendtally/features/training";
import {
  bodySummary,
  workoutMinutes,
  type LibraryWorkout,
  type WorkoutUse,
} from "@sendtally/features/workouts";
import { PhaseBar } from "../components/PhaseBar";
import { workoutPath } from "./useLibrary";

export type LibraryCardProps = {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  /** Its category's name; off where the page already names it. */
  showKind?: boolean;
};

/** A workout in the library: its kind, name, length, what it holds, and how much it ran. */
export function LibraryCard({
  workout,
  use,
  showKind = true,
}: LibraryCardProps): React.ReactElement {
  const count = use?.count ?? 0;
  const minutes = workoutMinutes(workout, count);
  const summary = bodySummary(workout);
  const items = sessionItems(workout.items, count);
  const [first] = items;
  const timed = items.length > 0 && items.every((i) => i.dose.onS !== undefined);
  const phases =
    workout.kind === "hangboard"
      ? first === undefined
        ? null
        : phasesFor(doseProtocol(workout.name, first.dose)).slice(1)
      : timed
        ? intervalPhases(intervalsOf(items)).slice(1)
        : null;
  return (
    <Link to={workoutPath(workout.id)} className="library-card">
      {showKind && (
        <span className="train-label" style={{ color: KIND_LOOK[workout.kind].ink }}>
          {kindLabel(workout.kind)}
        </span>
      )}
      <span className="library-card-head">
        <span className="train-title library-card-name">{workout.name}</span>
        {(workout.source === "mine" || minutes !== null) && (
          <span className="library-card-tags">
            {workout.source === "mine" && <span className="mine-badge">{t("workouts.mine")}</span>}
            {minutes !== null && <span className="train-label">{durationLabel(minutes)}</span>}
          </span>
        )}
      </span>
      {summary !== null && <span className="library-card-summary">{summary}</span>}
      {phases !== null && <PhaseBar phases={phases} height={12} />}
      <span className="library-card-foot">
        {count === 0 ? t("workouts.notUsed") : t("workouts.usedTimes", { count })}
      </span>
    </Link>
  );
}
