import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import {
  dayLabel,
  entryKindLabel,
  entryTitle,
  isoDay,
  type TripContents,
} from "@sendtally/features/journal";
import { sessionGradeLabels, sessionTitle } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

const note = { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textMuted };

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
    <View
      style={{
        gap: 10,
        padding: 16,
        borderRadius: radius.card,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text style={label}>{t("journal.tripGroups")}</Text>
      {rows.length === 0 && <Text style={note}>{t("journal.tripGroupsNothing")}</Text>}
      {rows.map((row) => (
        <View
          key={row.key}
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 10,
            paddingTop: 9,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLightSoft,
          }}
        >
          <Text style={{ ...label, width: 52 }}>{dayLabel(row.day)}</Text>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: fonts.sansSemiBold,
              fontSize: 14,
              color: colors.gunmetal,
            }}
          >
            {row.title}
          </Text>
          <Text style={label}>{row.kind}</Text>
        </View>
      ))}
      {rows.length > 0 && <Text style={note}>{t("journal.tripSessionsNote")}</Text>}
    </View>
  );
}
