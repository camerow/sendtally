import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  dayLabel,
  entryKindLabel,
  entryTitle,
  isoDay,
  type TripContents,
} from "@sendtally/features/journal";
import { sessionGradeLabels, sessionTitle } from "@sendtally/features/sessions";

/** What a trip draft's dates take in, so the grouping is seen before it is saved. */
export function TripPreview({ trip }: { trip: TripContents }): React.ReactElement {
  const rows = [
    ...trip.sessions.map((s) => ({
      key: s.fingerprint,
      day: isoDay(s.start_at),
      title: sessionTitle(s),
      kind: sessionGradeLabels(s)[0]?.label ?? "",
    })),
    ...trip.entries.map((e) => ({
      key: e.id,
      day: e.occurred_at,
      title: entryTitle(e),
      kind: entryKindLabel(e.kind),
    })),
  ].sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="journal-card" style={{ marginTop: 0 }}>
      <span className="journal-card-label">{t("journal.tripGroups")}</span>
      {rows.length === 0 && <span className="journal-muted">{t("journal.tripGroupsNothing")}</span>}
      {rows.map((row) => (
        <div key={row.key} className="trip-preview-row">
          <span className="journal-card-label">{dayLabel(row.day)}</span>
          <span className="trip-preview-title">{row.title}</span>
          <span className="journal-card-label">{row.kind}</span>
        </div>
      ))}
      {rows.length > 0 && <span className="journal-muted">{t("journal.tripSessionsNote")}</span>}
    </div>
  );
}
