import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** The log narrowed to one workout: its name on a gold pill, and a click clears it. */
export function WorkoutFilterBar({
  name,
  onClear,
}: {
  name: string;
  onClear: () => void;
}): React.ReactElement {
  const label = t("sessions.onlyWorkout", { name });
  return (
    <div className="workout-filter">
      <button
        type="button"
        className="workout-filter-pill"
        aria-label={`${label}, ${t("common.clear")}`}
        onClick={onClear}
      >
        <span className="workout-filter-label">{label}</span>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
