import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { JournalEntry, SessionWithClimbs } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  entryTitle,
  injuriesCarriedIn,
  tripDays,
  tripPyramid,
  tripStats,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { climbMetaLabel, climbVMs } from "@sendtally/features/session-detail";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { SessionRow } from "../sessions/SessionRow";
import { TrendTile } from "../trends/TrendTile";
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

const openSession = (session: SessionWithClimbs): void =>
  router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: session.fingerprint } });

/** Everything logged inside a trip's dates, a day at a time. */
export function TripBody({
  trip,
  sessions,
  entries,
}: {
  trip: JournalEntry;
  sessions: SessionWithClimbs[];
  entries: JournalEntry[];
}): React.ReactElement {
  const days = React.useMemo(() => tripDays(trip, sessions, entries), [trip, sessions, entries]);
  const logged = days.filter((d) => d.sessions.length + d.entries.length + d.updates.length > 0);
  const carriedIn = injuriesCarriedIn(trip, entries);
  const pyramid = tripPyramid(days);
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

      {pyramid !== null && (
        <View style={{ ...card, paddingVertical: 0, gap: 0 }}>
          <TrendTile tile={pyramid} />
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
            <React.Fragment key={session.fingerprint}>
              <SessionRow
                session={session}
                title={sessionTitle(session)}
                onPress={() => openSession(session)}
              />
              {climbVMs(session.climbs).map((c) => (
                <View
                  key={c.n}
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 10,
                    paddingVertical: 5,
                    paddingLeft: 30,
                    paddingRight: 18,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontFamily: fonts.sansMedium,
                      fontSize: 14,
                      color: colors.gunmetal,
                    }}
                  >
                    {c.name}
                  </Text>
                  {c.endurance === undefined && (
                    <Text style={{ ...label, textTransform: "none" }}>{climbMetaLabel(c)}</Text>
                  )}
                  <Text
                    style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: colors.gunmetal }}
                  >
                    {c.gradeLabel}
                  </Text>
                </View>
              ))}
            </React.Fragment>
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
