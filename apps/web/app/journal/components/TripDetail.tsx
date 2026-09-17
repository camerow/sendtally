import React from "react";
import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import { StatStrip } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  entryTitle,
  injuriesCarriedIn,
  tripDays,
  tripEffort,
  tripStats,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { EntryRowItem } from "../../sessions/components/EntryRowItem";
import { SessionRowItem } from "../../sessions/components/SessionRowItem";
import { TripEffort } from "./TripEffort";

/** Everything logged inside a trip's dates, a day at a time. */
export function TripDetail({
  trip,
  sessions,
  entries,
}: {
  trip: JournalEntry;
  sessions: SessionRow[];
  entries: JournalEntry[];
}): React.ReactElement {
  const days = React.useMemo(() => tripDays(trip, sessions, entries), [trip, sessions, entries]);
  const logged = days.filter((d) => d.sessions.length + d.entries.length + d.updates.length > 0);
  const carriedIn = injuriesCarriedIn(trip, entries);
  const parentTitle = (update: JournalEntry): string => {
    const parent = entries.find((e) => e.id === update.parent_id);
    return t("journal.updateOn", { title: parent === undefined ? "" : entryTitle(parent) });
  };

  return (
    <>
      <div style={{ marginTop: 24 }}>
        <StatStrip stats={tripStats(days)} />
      </div>
      {days.some((d) => d.sessions.length > 0) && <TripEffort effort={tripEffort(days)} />}
      {carriedIn.length > 0 && (
        <div className="journal-card">
          <span className="journal-card-label">{t("journal.alreadyOngoing")}</span>
          <div className="sessions-rows">
            {carriedIn.map((injury) => (
              <EntryRowItem key={injury.id} entry={injury} />
            ))}
          </div>
          <span className="journal-muted">{t("journal.carriedInNote")}</span>
        </div>
      )}
      <h2 className="trip-section-title">{t("journal.dayByDay")}</h2>
      {logged.length === 0 && <p className="journal-muted">{t("journal.tripGroupsNothing")}</p>}
      {logged.map((day) => (
        <section key={day.day} className="trip-day">
          <span className="trip-day-n">{t("journal.dayN", { n: day.n })}</span>
          <div className="sessions-rows">
            {day.entries.map((entry) => (
              <EntryRowItem key={entry.id} entry={entry} />
            ))}
            {day.sessions.map((session) => (
              <SessionRowItem
                key={session.fingerprint}
                session={session}
                title={sessionTitle(session)}
              />
            ))}
            {day.updates.map((update) => (
              <EntryRowItem key={update.id} entry={update} detail={parentTitle(update)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
