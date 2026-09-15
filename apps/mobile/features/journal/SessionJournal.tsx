import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import { entryTitle } from "@sendtally/features/journal";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press, pressRow } from "../../lib/press";
import { EntryKindChip } from "./EntryKindChip";

const heading = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase",
} as const;

/** A session takes as many entries as the user writes. */
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
    <View
      style={{
        gap: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        borderRadius: radius.card,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ ...heading, color: colors.watermelonInk }}>{t("journal.title")}</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/journal/new",
              params: { kind: "journal", date, session: fingerprint },
            })
          }
          style={press({ minHeight: 32, justifyContent: "center" })}
        >
          <Text style={{ ...heading, color: colors.azureInk }}>{t("journal.journalEntry")}</Text>
        </Pressable>
      </View>
      {entries.length === 0 && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
          {t("journal.emptyTitle")}
        </Text>
      )}
      {entries.map((entry, i) => (
        <Pressable
          key={entry.id}
          onPress={() => router.push({ pathname: "/journal/[id]", params: { id: entry.id } })}
          accessibilityRole="button"
          style={pressRow({
            gap: 6,
            paddingTop: i === 0 ? 0 : 12,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.lineOnLightSoft,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <EntryKindChip kind={entry.kind} />
            <Text style={{ ...heading, color: colors.textMuted }}>
              {formatDate(new Date(`${entry.occurred_at}T00:00:00Z`), {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              })}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
            {entryTitle(entry)}
          </Text>
          {entry.title !== null && entry.body.trim() !== "" && (
            <Text
              numberOfLines={4}
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
              }}
            >
              {entry.body}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
