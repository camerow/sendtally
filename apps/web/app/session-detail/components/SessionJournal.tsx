import React from "react";
import { Link } from "react-router";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { entryKindLabel, entryTitle } from "@sendtally/features/journal";

/**
 * A session takes as many entries as the user writes. The old single notes
 * field could hold exactly one, which is most of why it stayed empty.
 */
export function SessionJournal({
  fingerprint,
  date,
  entries,
}: {
  fingerprint: string;
  date: string;
  entries: JournalEntry[];
}): React.ReactElement {
  const newEntryHref = `/app/journal/new?date=${date}&session=${encodeURIComponent(fingerprint)}`;

  return (
    <section className="session-journal">
      <div className="session-journal-head">
        <span className="journal-card-label">{t("journal.title")}</span>
        <div style={{ flex: 1 }} />
        <Link to={newEntryHref} className="journal-action">
          {t("journal.writeAnEntry")}
        </Link>
      </div>
      {entries.length === 0 && <p className="journal-muted">{t("journal.emptyTitle")}</p>}
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`/app/journal/${encodeURIComponent(entry.id)}`}
          className="session-journal-entry"
        >
          <span className="session-journal-entry-head">
            <span className={`entry-kind entry-kind--${entry.kind}`}>
              {entryKindLabel(entry.kind)}
            </span>
            <span className="journal-card-label">
              {formatDate(new Date(`${entry.occurred_at}T00:00:00Z`), {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              })}
            </span>
          </span>
          <span className="session-journal-entry-title">{entryTitle(entry)}</span>
          {entry.title !== null && entry.body.trim() !== "" && (
            <span className="session-journal-entry-body">{entry.body}</span>
          )}
        </Link>
      ))}
    </section>
  );
}
