import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  useLapsTally,
  type GradePrefs,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { LIVE_HEADER, MinimiseButton } from "../../components/MinimiseButton";
import { press } from "../../lib/press";
import { Button } from "../training/components/Button";
import { RestRow } from "../training/rest/RestRow";
import type { RestClock } from "@sendtally/features/workouts";
import { LiveClimbEditor } from "./LiveClimbEditor";

export type LapsTallyProps = {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  gymName: string;
  prefs: GradePrefs;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
  onDone: () => void;
};

const faint = "rgba(255,255,255,0.55)";

/**
 * A workout's circuit laps as they happen, one line per lap like sets: how far each got and the
 * rest after it, which starts on play. A moves lap ends on Sent, or Fell and how far it got; a
 * time lap counts on the wall and goes clean at its target, Fell keeping the time so far.
 */
export function LapsTally({
  draft,
  live,
  rest,
  now,
  gymName,
  prefs,
  vocabulary,
  gyms,
  onDone,
}: LapsTallyProps): React.ReactElement | null {
  const [editing, setEditing] = React.useState(false);
  const laps = useLapsTally(draft, live, rest, now);
  if (laps === null) return null;
  const { circuit } = laps;

  const lapText = { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.white, width: 60 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gunmetal }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={LIVE_HEADER}>
        <MinimiseButton color={colors.white} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}
          >
            {gymName}
          </Text>
        </View>
        <Button label={t("common.done")} onPress={onDone} variant="goldText" height={44} />
      </View>

      <View style={{ alignItems: "center", gap: 2, paddingTop: 4, paddingBottom: 12 }}>
        <Text
          style={{
            fontFamily: fonts.displayHeavy,
            fontSize: 44,
            lineHeight: 50,
            letterSpacing: -1.3,
            color: colors.white,
          }}
        >
          {laps.clock}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
          {laps.line}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        {laps.rows.map((row, i) => (
          <Pressable
            key={i}
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel={`${row.label}, ${row.value}`}
            style={press({
              height: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingLeft: 12,
              paddingRight: 6,
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.05)",
            })}
          >
            <Text style={lapText}>{row.label}</Text>
            <View
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            >
              <View
                style={{
                  width: `${Math.round(row.share * 100)}%`,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: row.clean ? colors.fern : colors.watermelonInk,
                }}
              />
            </View>
            <Text style={{ fontFamily: fonts.monoMedium, fontSize: 13, color: colors.white }}>
              {row.value}
            </Text>
            <Text
              style={{
                width: 72,
                textAlign: "right",
                fontFamily: fonts.mono,
                fontSize: 11.5,
                color: faint,
              }}
            >
              {row.took}
            </Text>
          </Pressable>
        ))}

        {laps.rest !== null &&
          ("running" in laps.rest ? (
            <RestRow
              rest={laps.rest.running}
              left={laps.rest.left}
              onMore={laps.moreRest}
              onSkip={laps.skipRest}
            />
          ) : (
            <RestRow rest={null} seconds={laps.rest.seconds} onStart={laps.startRest} />
          ))}

        {laps.next !== null && (
          <View
            style={{
              height: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingLeft: 12,
              paddingRight: 6,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <Text style={lapText}>{laps.next.label}</Text>
            {laps.next.startable ? (
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Button
                  label={t("tally.startLap")}
                  onPress={laps.startLap}
                  variant="goldText"
                  height={40}
                />
              </View>
            ) : (
              <Text style={{ flex: 1, fontFamily: fonts.mono, fontSize: 13, color: colors.white }}>
                {laps.next.text}
              </Text>
            )}
          </View>
        )}

        <View style={{ alignItems: "flex-start" }}>
          <Button label={t("tally.addLap")} onPress={laps.addLap} variant="goldText" height={44} />
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingTop: 12,
          paddingBottom: 10,
          paddingHorizontal: 18,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.12)",
        }}
      >
        <Pressable
          onPress={() => setEditing(laps.fell())}
          disabled={laps.off}
          accessibilityRole="button"
          accessibilityState={{ disabled: laps.off }}
          style={press({
            flex: 1,
            height: 72,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.5)",
            alignItems: "center",
            justifyContent: "center",
            opacity: laps.off ? 0.35 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.white }}>
            {t("tally.fell")}
          </Text>
        </Pressable>
        {!laps.timed && (
          <Pressable
            onPress={laps.sent}
            disabled={laps.done}
            accessibilityRole="button"
            accessibilityState={{ disabled: laps.done }}
            style={press({
              flex: 1,
              height: 72,
              borderRadius: 16,
              backgroundColor: colors.gold,
              alignItems: "center",
              justifyContent: "center",
              opacity: laps.done ? 0.35 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gunmetal }}>
              {t("common.sent")}
            </Text>
          </Pressable>
        )}
      </View>

      <LiveClimbEditor
        climb={editing ? (circuit ?? null) : null}
        index={circuit === undefined ? 0 : draft.climbs.indexOf(circuit)}
        count={draft.climbs.length}
        prefs={prefs}
        vocabulary={vocabulary}
        gyms={gyms}
        onChange={(c) => live.updateClimb(c.key, () => c)}
        onRemove={() => {
          if (circuit !== undefined)
            live.replace({ ...draft, climbs: draft.climbs.filter((c) => c !== circuit) });
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </SafeAreaView>
  );
}
