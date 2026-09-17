import React from "react";
import { formatNumber, t } from "@sendtally/features/i18n";

/** One bar per day of the trip, its height the day's hardest RPE. */
export function TripEffort({ effort }: { effort: Array<number | null> }): React.ReactElement {
  return (
    <div className="journal-card">
      <span className="journal-card-label">{t("journal.effortByDay")}</span>
      <div className="trip-effort-bars">
        {effort.map((rpe, i) => (
          <div key={i} className="trip-effort-day">
            {rpe === null ? (
              <span className="trip-effort-none" />
            ) : (
              <>
                <span className="trip-effort-value">{formatNumber(rpe)}</span>
                <span className="trip-effort-bar" style={{ height: rpe * 9 }} />
              </>
            )}
            <span className="trip-effort-value">{formatNumber(i + 1)}</span>
          </div>
        ))}
      </div>
      <span className="journal-muted">{t("journal.effortByDayNote")}</span>
    </div>
  );
}
