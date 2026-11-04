import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { NoteRow } from "../../components/NoteRow";
import { SectionHeading } from "../../components/SectionHeading";

/** A session's notes, a plain section: each one opens on a tap, and + writes another on its day. */
export function SessionJournal({
  fingerprint,
  date,
  entries,
}: {
  fingerprint: string;
  date: string;
  entries: JournalEntry[];
}): React.ReactElement {
  return (
    <View style={{ gap: 2 }}>
      <SectionHeading
        title={t("common.notes")}
        add={{
          label: t("climbs.addNote"),
          onPress: () =>
            router.push({
              pathname: "/journal/new",
              params: { kind: "journal", date, session: fingerprint },
            }),
        }}
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
          onPress={() => router.push({ pathname: "/journal/[id]", params: { id: entry.id } })}
        />
      ))}
    </View>
  );
}
