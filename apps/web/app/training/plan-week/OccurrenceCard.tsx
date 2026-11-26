import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { occurrenceMeta, plannedItems, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Lock } from "../../components/Lock";
import { MoreMenu } from "../../components/MoreMenu";
import { StartButton } from "../components/StartButton";
import { useWorkoutStart } from "../library-detail/useWorkoutStart";
import { membershipPagePath } from "../locks";
import { DayMark } from "./DayMark";
import { occurrenceLogLink, occurrencePath } from "./planLinks";
import { useDayChanges } from "./useDayChanges";

/**
 * A workout due today, its kind marked by its name: the card opens the workout, Start runs what
 * it prescribes, Log it logs this run, and Resume goes back to it running. Locked, its name is
 * muted with the lock and Become a member takes the place of Start, Log it and ···.
 */
export function OccurrenceCard({
  occurrence: o,
  workout,
  locked: lockedDay = false,
}: {
  occurrence: Occurrence;
  workout: LibraryWorkout;
  locked?: boolean;
}): React.ReactElement {
  const changes = useDayChanges();
  const logIt = occurrenceLogLink(workout, o);
  const start = useWorkoutStart(workout, o.date, plannedItems(o));
  const locked = lockedDay && start?.resume !== true;
  return (
    <div className="plan-card">
      <div className="plan-card-head">
        <Link
          to={locked ? membershipPagePath("plan_day") : occurrencePath(o)}
          className={locked ? "plan-card-title plan-card-title--locked" : "plan-card-title"}
          aria-label={locked ? t("common.membersOnly", { label: workout.name }) : undefined}
        >
          {workout.name}
        </Link>
        {locked ? (
          <Lock />
        ) : (
          start?.resume !== true && (
            <MoreMenu label={t("summary.more")} items={changes.items(o, workout.name)} />
          )
        )}
      </div>
      <div className="plan-card-meta">
        <DayMark kind={workout.kind} filled />
        <span>{occurrenceMeta(o)}</span>
      </div>
      {locked ? (
        <Link to={membershipPagePath("plan_day")} className="plan-card-start">
          {t("billing.becomeAMember")}
        </Link>
      ) : (
        (start !== null || logIt !== null) && (
          <div className="plan-card-actions">
            {start !== null && <StartButton start={start} className="plan-card-start" />}
            {start?.resume !== true && logIt !== null && (
              <Link to={logIt} className="plan-card-log">
                {t("workouts.logIt")}
              </Link>
            )}
          </div>
        )
      )}
      {changes.sheets}
    </div>
  );
}
