import React from "react";
import { Text, View } from "react-native";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { NoteRow } from "../../components/NoteRow";
import { SectionHeading } from "../../components/SectionHeading";

/** A session's notes, a plain section: a tap edits one in the note sheet, and + writes another. */
export function SessionJournal({
  entries,
  onAdd,
  onOpen,
}: {
  entries: JournalEntry[];
  /** Opens the note sheet, which writes on the session's day. */
  onAdd: () => void;
  onOpen: (entry: JournalEntry) => void;
}): React.ReactElement {
  return (
    <View style={{ gap: 2 }}>
      <SectionHeading
        title={t("common.notes")}
        add={{ label: t("climbs.addNote"), onPress: onAdd }}
      />
      {entries.length === 0 && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
          {t("journal.emptyTitle")}
        </Text>
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
    </View>
  );
}
