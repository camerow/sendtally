import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { useLibrary } from "../library/useLibrary";

export type PlayerHeaderProps = { kind: ActivityKind; title: string; workoutId: string | null };

/**
 * The workout's kind, its name with its description behind an info button, and its target
 * effort: the top of the sets and checklist players.
 */
export function PlayerHeader({ kind, title, workoutId }: PlayerHeaderProps): React.ReactElement {
  const { state } = useLibrary();
  const workout =
    state.status === "ready" && workoutId !== null ? state.data.workout(workoutId) : undefined;
  const [about, setAbout] = React.useState(false);
  return (
    <div className="player-head">
      <span className="train-label" style={{ color: KIND_LOOK[kind].ink }}>
        {kindLabel(kind)}
      </span>
      <span className="player-title-row">
        <h1 className="train-title player-title">{title}</h1>
        {workout !== undefined && workout.description !== "" && (
          <button
            type="button"
            className="player-info"
            aria-label={t("workouts.about")}
            onClick={() => setAbout(true)}
          >
            <Icon name="info" size={18} />
          </button>
        )}
      </span>
      {workout?.targetRpe != null && (
        <span className="player-target">{t("plan.targetValue", { n: workout.targetRpe })}</span>
      )}
      {workout !== undefined && (
        <Sheet
          open={about}
          kicker={kindLabel(workout.kind)}
          title={workout.name}
          onClose={() => setAbout(false)}
        >
          <p className="sheet-body">{workout.description}</p>
        </Sheet>
      )}
    </div>
  );
}
