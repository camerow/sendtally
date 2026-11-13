import React from "react";
import { t } from "@sendtally/features/i18n";
import { plannedOn, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { usePlanActions } from "../data/usePlanActions";
import { DayMark } from "./DayMark";

/** A planned run skipped: on its day, dashed and faded, with why and Undo skip. */
export function SkippedRow({
  occurrence: o,
  workout,
}: {
  occurrence: Occurrence;
  workout: LibraryWorkout;
}): React.ReactElement {
  const actions = usePlanActions();
  const reason = o.change?.reason ?? null;
  const note = o.change?.note ?? null;
  return (
    <div className="plan-row plan-row--skipped">
      <DayMark kind={workout.kind} filled={false} missed />
      <span className="plan-row-text">
        <span className="plan-label-small plan-label--muted">
          {reason === null
            ? t("plan.skipped")
            : t("plan.skippedWhy", { reason: t(`plan.reason_${reason}`) })}
        </span>
        <span className="plan-row-name">{workout.name}</span>
        {note !== null && <span className="plan-row-note">{note}</span>}
      </span>
      <button
        type="button"
        className="plan-row-undo"
        onClick={() => void actions.undoPlanChange(o.membership.id, plannedOn(o))}
      >
        {t("plan.undoSkip")}
      </button>
    </div>
  );
}
