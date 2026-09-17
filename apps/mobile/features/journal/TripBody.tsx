import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { JournalEntry, SessionRow as SessionRowData } from "@sendtally/api-client";
import { formatNumber, t } from "@sendtally/features/i18n";
import {
  effortDayLabel,
  effortLabelled,
  entryTitle,
  injuriesCarriedIn,
  tripDays,
  tripEffort,
  tripStats,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { SessionRow } from "../sessions/SessionRow";
import { EntryRow } from "./EntryRow";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

const card = {
  gap: 12,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.lineOnLightSoft,
  borderRadius: radius.card,
  paddingVertical: 16,
} as const;

const openEntry = (entry: JournalEntry): void =>
  router.push({ pathname: "/journal/[id]", params: { id: entry.parent_id ?? entry.id } });

const openSession = (session: SessionRowData): void =>
  router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: session.fingerprint } });

/** Everything logged inside a trip's dates, a day at a time. */
export function TripBody({
  trip,
  sessions,
  entries,
}: {
  trip: JournalEntry;
  sessions: SessionRowData[];
  entries: JournalEntry[];
}): React.ReactElement {
  const days = React.useMemo(() => tripDays(trip, sessions, entries), [trip, sessions, entries]);
  const logged = days.filter((d) => d.sessions.length + d.entries.length + d.updates.length > 0);
  const carriedIn = injuriesCarriedIn(trip, entries);
  const effort = tripEffort(days);
  const labelled = effortLabelled(effort.length);
  const stats = tripStats(days);
  const updateOn = (update: JournalEntry): string => {
    const parent = entries.find((e) => e.id === update.parent_id);
    return t("journal.updateOn", { title: parent === undefined ? "" : entryTitle(parent) });
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.lineOnLight,
        }}
      >
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            style={{
              width: "50%",
              gap: 3,
              paddingVertical: 12,
              paddingRight: 14,
              paddingLeft: i % 2 === 0 ? 0 : 14,
              borderRightWidth: i % 2 === 0 ? 1 : 0,
              borderRightColor: colors.lineOnLightSoft,
            }}
          >
            <Text style={label}>{stat.label}</Text>
            <Text
              style={{
                fontFamily: fonts.monoSemiBold,
                fontSize: 17,
                color: colors.gunmetal,
              }}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {effort.some((rpe) => rpe !== null) && (
        <View style={{ ...card, paddingHorizontal: 16 }}>
          <Text style={label}>{t("journal.effortByDay")}</Text>
          <View
            style={{
              flexDirection: "row",
              gap: labelled ? 6 : 2,
              height: 124,
              alignItems: "flex-end",
            }}
          >
            {effort.map((rpe, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                {labelled && rpe !== null && <Text style={label}>{formatNumber(rpe)}</Text>}
                <View
                  style={{
                    width: "100%",
                    maxWidth: 26,
                    height: rpe === null ? 3 : rpe * 8,
                    borderRadius: rpe === null ? 2 : 4,
                    backgroundColor: rpe === null ? "rgba(64,63,76,0.16)" : colors.azure,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{ ...label, lineHeight: 12, minHeight: 12, overflow: "visible" }}
                >
                  {effortDayLabel(i, effort.length)}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 18,
              color: colors.textMuted,
            }}
          >
            {t("journal.effortByDayNote")}
          </Text>
        </View>
      )}

      {carriedIn.length > 0 && (
        <View style={card}>
          <Text style={{ ...label, paddingHorizontal: 16 }}>{t("journal.alreadyOngoing")}</Text>
          <View>
            {carriedIn.map((injury) => (
              <EntryRow key={injury.id} entry={injury} onPress={() => openEntry(injury)} />
            ))}
          </View>
          <Text
            style={{
              paddingHorizontal: 16,
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 18,
              color: colors.textMuted,
            }}
          >
            {t("journal.carriedInNote")}
          </Text>
        </View>
      )}

      <Text
        style={{
          marginTop: 10,
          fontFamily: fonts.display,
          fontSize: 19,
          letterSpacing: -0.4,
          color: colors.gunmetal,
        }}
      >
        {t("journal.dayByDay")}
      </Text>
      {logged.length === 0 && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted }}>
          {t("journal.tripGroupsNothing")}
        </Text>
      )}
      {logged.map((day) => (
        <View key={day.day} style={{ marginHorizontal: -18 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 10,
              paddingHorizontal: 18,
              paddingBottom: 6,
              borderBottomWidth: 1,
              borderBottomColor: colors.lineOnLight,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                letterSpacing: -0.3,
                color: colors.gunmetal,
              }}
            >
              {t("journal.dayN", { n: day.n })}
            </Text>
          </View>
          {day.entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onPress={() => openEntry(entry)} />
          ))}
          {day.sessions.map((session) => (
            <SessionRow
              key={session.fingerprint}
              session={session}
              title={sessionTitle(session)}
              onPress={() => openSession(session)}
            />
          ))}
          {day.updates.map((update) => (
            <EntryRow
              key={update.id}
              entry={update}
              detail={updateOn(update)}
              onPress={() => openEntry(update)}
            />
          ))}
        </View>
      ))}
    </>
  );
}
