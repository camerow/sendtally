import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  allLapsDone,
  enduranceLapValueLabel,
  FELL_AFTER_START,
  isCleanLap,
  lapClockLabel,
  lapElapsed,
  lapLine,
  lapsClimb,
  withLapAdded,
  withLapLogged,
  withLapRest,
  withLapStarted,
  type GradePrefs,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { LIVE_HEADER, MinimiseButton } from "../../components/MinimiseButton";
import { press } from "../../lib/press";
import { Button } from "../training/components/Button";
import { RestRow } from "../training/rest/RestRow";
import { MORE_REST_S } from "@sendtally/features/workouts";
import type { RestClock } from "../training/rest/useRest";
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

const restKey = (lap: number): string => `lap-${lap}`;

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
  const ex = draft.exercise;
  const timed = ex?.lap?.unit === "seconds";
  const elapsed = ex === undefined ? null : lapElapsed(ex, now);
  const target = ex?.lap?.target ?? 0;
  const timeUp = timed && elapsed !== null && elapsed >= target;
  React.useEffect(() => {
    if (timeUp) live.replace(withLapLogged(draft, target));
  }, [timeUp, draft, live, target]);

  if (ex?.lap === undefined) return null;
  const circuit = lapsClimb(draft.climbs, ex.item);
  const laps = circuit?.endurance?.laps ?? [];
  const done = allLapsDone(draft);
  const last = laps.length - 1;
  const restS = ex.restS;
  const running = rest.rest !== null && rest.rest.at === restKey(last) ? rest.rest : null;

  /** A rest still running when the next lap goes keeps the time it took so far. */
  const endRest = (d: LogSessionDraft): LogSessionDraft => {
    if (running === null) return d;
    rest.skip();
    return withLapRest(d, last, running.seconds - rest.left);
  };
  const log = (value: number): LogSessionDraft => {
    const next = withLapLogged(endRest(draft), value);
    live.replace(next);
    return next;
  };
  const sent = (): void => {
    log(ex.lap?.target ?? 0);
  };
  const fell = (): void => {
    if (timed) {
      log(elapsed ?? 0);
      return;
    }
    log(FELL_AFTER_START);
    setEditing(true);
  };
  const startLap = (): void => live.replace(withLapStarted(endRest(draft), new Date()));
  const startRest = (): void => {
    rest.tick(restKey(last), restS);
    live.replace(withLapRest(draft, last, restS));
  };
  const moreRest = (): void => {
    rest.more();
    live.replace(withLapRest(draft, last, (ex.rests?.[last] ?? restS) + MORE_REST_S));
  };
  const skipRest = (): void => live.replace(endRest(draft));

  const footerOff = done || (timed && elapsed === null);
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
          {lapClockLabel(draft)}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
          {lapLine(draft)}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        {circuit?.endurance !== undefined &&
          laps.map((lap, i) => {
            const e = circuit.endurance;
            if (e === undefined) return null;
            const took = ex.rests?.[i];
            return (
              <Pressable
                key={i}
                onPress={() => setEditing(true)}
                accessibilityRole="button"
                accessibilityLabel={`${t("tally.lapLabel", { lap: i + 1 })}, ${enduranceLapValueLabel(e, i)}`}
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
                <Text style={lapText}>{t("tally.lapLabel", { lap: i + 1 })}</Text>
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
                      width: `${Math.round((Math.min(lap, e.target) / e.target) * 100)}%`,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: isCleanLap(e, i) ? colors.fern : colors.watermelonInk,
                    }}
                  />
                </View>
                <Text style={{ fontFamily: fonts.monoMedium, fontSize: 13, color: colors.white }}>
                  {enduranceLapValueLabel(e, i)}
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
                  {took === undefined || (i === last && running !== null)
                    ? ""
                    : t("tally.restTook", { time: elapsedClock(took) })}
                </Text>
              </Pressable>
            );
          })}

        {!done &&
          laps.length > 0 &&
          restS > 0 &&
          (running !== null || ex.rests?.[last] === undefined) &&
          (running !== null ? (
            <RestRow rest={running} left={rest.left} onMore={moreRest} onSkip={skipRest} />
          ) : (
            <RestRow rest={null} seconds={restS} onStart={startRest} />
          ))}

        {!done && (
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
            <Text style={lapText}>{t("tally.lapLabel", { lap: laps.length + 1 })}</Text>
            {timed && elapsed === null ? (
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Button
                  label={t("tally.startLap")}
                  onPress={startLap}
                  variant="goldText"
                  height={40}
                />
              </View>
            ) : (
              <Text style={{ flex: 1, fontFamily: fonts.mono, fontSize: 13, color: colors.white }}>
                {timed
                  ? `${elapsedClock(elapsed ?? 0)} / ${elapsedClock(target)}`
                  : t("tally.onTheWall")}
              </Text>
            )}
          </View>
        )}

        <View style={{ alignItems: "flex-start" }}>
          <Button
            label={t("tally.addLap")}
            onPress={() => live.replace(withLapAdded(draft))}
            variant="goldText"
            height={44}
          />
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
          onPress={fell}
          disabled={footerOff}
          accessibilityRole="button"
          accessibilityState={{ disabled: footerOff }}
          style={press({
            flex: 1,
            height: 72,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.5)",
            alignItems: "center",
            justifyContent: "center",
            opacity: footerOff ? 0.35 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.white }}>
            {t("tally.fell")}
          </Text>
        </Pressable>
        {!timed && (
          <Pressable
            onPress={sent}
            disabled={done}
            accessibilityRole="button"
            accessibilityState={{ disabled: done }}
            style={press({
              flex: 1,
              height: 72,
              borderRadius: 16,
              backgroundColor: colors.gold,
              alignItems: "center",
              justifyContent: "center",
              opacity: done ? 0.35 : 1,
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
