import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { useLibrary } from "../library/useLibrary";
import { WorkoutInfo } from "./WorkoutInfo";

export type PlayerHeaderProps = { kind: ActivityKind; title: string; workoutId: string | null };

/**
 * The workout's kind, its name with its description behind an info button, and its target
 * effort: the top of the sets and checklist players.
 */
export function PlayerHeader({ kind, title, workoutId }: PlayerHeaderProps): React.ReactElement {
  const { state } = useLibrary();
  const workout =
    state.status === "ready" && workoutId !== null ? state.data.workout(workoutId) : undefined;
  return (
    <div className="player-head">
      <span className="train-label" style={{ color: KIND_LOOK[kind].ink }}>
        {kindLabel(kind)}
      </span>
      <span className="player-title-row">
        <h1 className="train-title player-title">{title}</h1>
        {workoutId !== null && <WorkoutInfo workoutId={workoutId} />}
      </span>
      {workout?.targetRpe != null && (
        <span className="player-target">{t("plan.targetValue", { n: workout.targetRpe })}</span>
      )}
    </div>
  );
}
