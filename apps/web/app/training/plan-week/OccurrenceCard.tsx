import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { occurrenceMeta, plannedItems, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { MoreMenu } from "../../components/MoreMenu";
import { StartButton } from "../components/StartButton";
import { useHangData } from "../data/HangDataContext";
import { useWorkoutStart } from "../library-detail/useWorkoutStart";
import { DayMark } from "./DayMark";
import { occurrenceLogLink, occurrencePath } from "./planLinks";
import { useDayChanges } from "./useDayChanges";

/**
 * A workout due today, its kind marked by its name: the card opens the workout, Start runs what
 * it prescribes, Log it logs this run, and Resume goes back to it running.
 */
export function OccurrenceCard({
  occurrence: o,
  workout,
}: {
  occurrence: Occurrence;
  workout: LibraryWorkout;
}): React.ReactElement {
  const { model } = useHangData();
  const changes = useDayChanges();
  const logIt = occurrenceLogLink(workout, o);
  const start = useWorkoutStart(workout, o.date, plannedItems(o));
  return (
    <div className="plan-card">
      <div className="plan-card-head">
        <Link to={occurrencePath(o)} className="plan-card-title">
          {workout.name}
        </Link>
        {start?.resume !== true && (
          <MoreMenu label={t("summary.more")} items={changes.items(o, workout.name)} />
        )}
      </div>
      <div className="plan-card-meta">
        <DayMark kind={workout.kind} filled />
        <span>{occurrenceMeta(o, model.settings.units)}</span>
      </div>
      {(start !== null || logIt !== null) && (
        <div className="plan-card-actions">
          {start !== null && <StartButton start={start} className="plan-card-start" />}
          {start?.resume !== true && logIt !== null && (
            <Link to={logIt} className="plan-card-log">
              {t("workouts.logIt")}
            </Link>
          )}
        </div>
      )}
      {changes.sheets}
    </div>
  );
}
