import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import {
  KIND_LOOK,
  occurrenceMeta,
  occurrenceTag,
  type Occurrence,
} from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { MoreMenu } from "../../components/MoreMenu";
import { useHangData } from "../data/HangDataContext";
import { DayMark } from "./DayMark";
import { KindCircle } from "./KindCircle";
import { occurrenceLogLink, occurrencePath } from "./planLinks";
import { useDayChanges } from "./useDayChanges";

/**
 * A planned workout on a day that is not today's to start: still to come, or missed, crossed on
 * its kind's mark, with ··· to log it, reschedule or skip.
 */
export function OccurrenceRow({
  occurrence: o,
  workout,
}: {
  occurrence: Occurrence;
  workout: LibraryWorkout;
}): React.ReactElement {
  const { model } = useHangData();
  const changes = useDayChanges();
  const missed = o.status === "missed";
  const meta = occurrenceMeta(o, model.settings.units);
  return (
    <div className="plan-row">
      {missed ? (
        <KindCircle kind={workout.kind} badge="missed" />
      ) : (
        <DayMark kind={workout.kind} filled={false} />
      )}
      <Link
        to={occurrencePath(o)}
        className="plan-row-text plan-row-text--link"
        aria-label={missed ? `${t("hang.missed")}: ${workout.name}` : undefined}
      >
        {!missed && (
          <span className="plan-label-small" style={{ color: KIND_LOOK[workout.kind].ink }}>
            {occurrenceTag(t("hang.planned"), o)}
          </span>
        )}
        <span className="plan-row-name">{workout.name}</span>
        <span className="plan-row-meta">{meta}</span>
      </Link>
      {(o.status === "planned" || missed) && (
        <MoreMenu
          label={t("summary.more")}
          items={changes.items(o, workout.name, missed ? occurrenceLogLink(workout, o) : null)}
        />
      )}
      {changes.sheets}
    </div>
  );
}
