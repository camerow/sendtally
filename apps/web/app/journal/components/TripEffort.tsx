import React from "react";
import { formatNumber, t } from "@sendtally/features/i18n";
import { effortDayLabel, effortLabelled } from "@sendtally/features/journal";

/** One bar per day of the trip, its height the day's hardest RPE. */
export function TripEffort({ effort }: { effort: Array<number | null> }): React.ReactElement {
  const labelled = effortLabelled(effort.length);
  return (
    <div className="journal-card">
      <span className="journal-card-label">{t("journal.effortByDay")}</span>
      <div className={labelled ? "trip-effort-bars" : "trip-effort-bars trip-effort-bars--dense"}>
        {effort.map((rpe, i) => (
          <div key={i} className="trip-effort-day">
            {rpe === null ? (
              <span className="trip-effort-none" />
            ) : (
              <>
                {labelled && <span className="trip-effort-value">{formatNumber(rpe)}</span>}
                <span className="trip-effort-bar" style={{ height: rpe * 9 }} />
              </>
            )}
            <span className="trip-effort-value">{effortDayLabel(i, effort.length)}</span>
          </div>
        ))}
      </div>
      <span className="journal-muted">{t("journal.effortByDayNote")}</span>
    </div>
  );
}
