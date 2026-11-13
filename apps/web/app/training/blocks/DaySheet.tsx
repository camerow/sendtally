import React from "react";
import { useNavigate } from "react-router";
import { kindLabel } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { occurrenceLogLink } from "../plan-week/planLinks";
import { membershipPath } from "./paths";

export type DaySheetProps = {
  occurrence: Occurrence;
  workout: LibraryWorkout;
  /** Reschedule and Skip, and Log it first on a missed day, as the day's ··· lists them. */
  rows: (logIt: string | null) => MoreMenuItem[];
  onClose: () => void;
};

/**
 * One planned day of a block's week: reschedule or skip it, or log it; a missed one is logged
 * from its rows. Its name opens the workout.
 */
export function DaySheet({
  occurrence: o,
  workout,
  rows,
  onClose,
}: DaySheetProps): React.ReactElement {
  const navigate = useNavigate();
  const missed = o.status === "missed";
  const logIt = occurrenceLogLink(workout, o);
  const day = shortDate(o.date);
  return (
    <Sheet
      open
      kicker={o.block?.name ?? kindLabel(workout.kind)}
      title={workout.name}
      titleTo={membershipPath(o.membership)}
      under={
        <span className="day-line">
          {o.week !== null && `${t("plan.weekNumber", { n: o.week })} · `}
          {missed ? <span className="day-line-missed">{t("plan.missedOn", { day })}</span> : day}
        </span>
      }
      onClose={onClose}
      {...(!missed &&
        logIt !== null && {
          action: { label: t("workouts.logIt"), onPress: () => void navigate(logIt) },
        })}
    >
      <div className="day-sheet-rows">
        {rows(missed ? logIt : null).map((item) => (
          <button
            key={item.label}
            type="button"
            className={item.destructive === true ? "more-item more-item--danger" : "more-item"}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
