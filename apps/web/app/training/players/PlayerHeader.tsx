import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { gymLine } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { Description } from "../components/Description";
import { useLibrary, workoutIn } from "../library/useLibrary";

export type PlayerHeaderProps = {
  kind: ActivityKind;
  title: string;
  workoutId: string | null;
  /** Where the run is: "Exercise 2 of 3". */
  position?: { at: number; of: number } | null;
  /** The workout has no exercises, so its description is the body and opens unfolded. */
  bare?: boolean;
  /** Where a workout with climbing in it is climbed: "At Crux ⌄" or "No gym ⌄", which picks another. */
  gym?: { name: string | undefined; onPick: () => void } | undefined;
};

/**
 * The workout's kind, its name, where the run is and its target effort, and its description
 * folded to three lines: the top of the sets and checklist players.
 */
export function PlayerHeader({
  kind,
  title,
  workoutId,
  position = null,
  bare = false,
  gym,
}: PlayerHeaderProps): React.ReactElement {
  const workout = workoutIn(useLibrary())(workoutId);
  const line = [
    position !== null && t("workouts.exerciseOf", { n: position.at, of: position.of }),
    workout?.targetRpe != null && t("plan.targetValue", { n: workout.targetRpe }),
  ].filter((part) => part !== false);
  return (
    <div className="player-head">
      <span className="train-label" style={{ color: KIND_LOOK[kind].ink }}>
        {kindLabel(kind)}
      </span>
      <h1 className="train-title player-title">{title}</h1>
      {(line.length > 0 || gym !== undefined) && (
        <span className="player-target">
          {[...line, ...(gym === undefined ? [] : [""])].join(" · ")}
          {gym !== undefined && (
            <button
              type="button"
              className="player-gym"
              aria-label={`${t("gyms.gym")}, ${gym.name ?? t("gyms.noGym")}`}
              onClick={gym.onPick}
            >
              {gymLine(gym.name)}
              <Icon name="chevron" size={12} strokeWidth={2} />
            </button>
          )}
        </span>
      )}
      {workout !== undefined && (
        <Description key={workout.id} text={workout.description} fold={3} startOpen={bare} />
      )}
    </div>
  );
}
