import React from "react";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { useLibrary } from "../library/useLibrary";

/** An info button beside a running workout's name that opens its description; none without one. */
export function WorkoutInfo({
  workoutId,
  dark = false,
}: {
  workoutId: string;
  /** On the dark timer, in its softer ink. */
  dark?: boolean;
}): React.ReactElement | null {
  const { state } = useLibrary();
  const workout = state.status === "ready" ? state.data.workout(workoutId) : undefined;
  const [open, setOpen] = React.useState(false);
  if (workout === undefined || workout.description === "") return null;
  return (
    <>
      <button
        type="button"
        className={dark ? "player-info player-info--dark" : "player-info"}
        aria-label={t("workouts.about")}
        onClick={() => setOpen(true)}
      >
        <Icon name="info" size={18} />
      </button>
      <Sheet
        open={open}
        kicker={kindLabel(workout.kind)}
        title={workout.name}
        onClose={() => setOpen(false)}
      >
        <p className="sheet-body">{workout.description}</p>
      </Sheet>
    </>
  );
}
