import React from "react";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { NoteRow } from "../../components/detail/NoteRow";
import { SectionHeading } from "../../components/detail/SectionHeading";

/** A session's notes: a click edits one in the note sheet, and + writes another. */
export function SessionJournal({
  entries,
  onAdd,
  onOpen,
}: {
  entries: JournalEntry[];
  onAdd: () => void;
  onOpen: (entry: JournalEntry) => void;
}): React.ReactElement {
  return (
    <section className="detail-section">
      <SectionHeading
        title={t("common.notes")}
        add={{ label: t("climbs.addNote"), onPress: onAdd }}
      />
      {entries.length === 0 && (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-white-secondary)" }}>
          {t("journal.emptyTitle")}
        </p>
      )}
      {entries.map((entry) => (
        <NoteRow
          key={entry.id}
          date={formatDate(new Date(`${entry.occurred_at}T00:00:00Z`), {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          })}
          title={entry.title}
          body={entry.body}
          onPress={() => onOpen(entry)}
        />
      ))}
    </section>
  );
}
