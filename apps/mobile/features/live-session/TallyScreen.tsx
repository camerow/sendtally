import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typicalGradeIndex, useClimbVocabulary } from "@sendtally/features/climbs";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  finishLiveSession,
  finishSummary,
  tallyElapsedSeconds,
  tallySummary,
  useLiveSession,
  useTally,
} from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { LIVE_HEADER, leaveLiveScreen, MinimiseButton } from "../../components/MinimiseButton";
import { useApi } from "../../lib/api";
import { useSessions } from "../../lib/useSessions";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { press } from "../../lib/press";
import { Button } from "../training/components/Button";
import { readPlanLink } from "@sendtally/features/training";
import { useRest } from "../training/rest/useRest";
import { ExerciseClock } from "./ExerciseClock";
import { FinishSheet } from "./FinishSheet";
import { GradeChips } from "../../components/GradeChips";
import { GymSheet } from "./GymSheet";
import { LapsTally } from "./LapsTally";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { LiveClock } from "../../components/LiveClock";
import { TallyRow } from "./TallyRow";
import { UndoSnackbar } from "./UndoSnackbar";

export type TallyScreenProps = {
  /**
   * Logs the workout exercise the player started it on, into the player: its sets end on
   * their last climb or their time, and rest; Done hands the climbs back, asking no effort.
   */
  exercise?: boolean;
};

/** The gym session as it happens: a grade starts a climb, then Fell or Sent for each go. */
export function TallyScreen({ exercise = false }: TallyScreenProps): React.ReactElement {
  const api = useApi();
  const localSessions = useSessions();
  const params = useLocalSearchParams();
  const plan = readPlanLink(params);
  const live = useLiveSession(exercise ? exerciseTallyStorage : liveSessionStorage);
  const rest = useRest();
  const gyms = useGyms(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const [editing, setEditing] = React.useState<string | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [finishing, setFinishing] = React.useState(params.finish === "1");
  const name = typeof params.name === "string" ? params.name : undefined;
  const tally = useTally({
    live,
    rest,
    exercise,
    gyms: gyms.gyms,
    settled: sessions.status !== "loading" && gyms.state.status !== "loading",
    lastGymId:
      sessions.status === "ready"
        ? (sessions.data.sessions.find((s) => s.gym_id !== null)?.gym_id ?? undefined)
        : undefined,
    scales,
    kindStorage: climbKindStorage,
    typicalIndex: (scale) => typicalGradeIndex(vocabulary.climbs, scale),
    start: { plan, name },
  });
  const { draft, gym, circuitGym, selection, snack, now } = tally;

  if (draft === null || (exercise && draft.exercise === undefined)) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.gunmetal }} />;
  }

  if (exercise && draft.exercise?.lap !== undefined) {
    return (
      <LapsTally
        draft={draft}
        live={live}
        rest={rest}
        now={now}
        gymName={gym?.name ?? t("gyms.noGym")}
        prefs={scales}
        vocabulary={vocabulary}
        gyms={circuitGym === null ? [] : [circuitGym]}
        onDone={() => {
          tally.done();
          leaveLiveScreen();
        }}
      />
    );
  }

  const save = (rpe: number | null): void => {
    const fingerprint = finishLiveSession(localSessions.save, liveSessionStorage, rpe);
    setFinishing(false);
    if (fingerprint === null) leaveLiveScreen();
    else router.replace({ pathname: "/session/[fingerprint]", params: { fingerprint } });
  };

  const done = (): void => {
    tally.done();
    leaveLiveScreen();
  };

  const discard = (): void => {
    Alert.alert(t("tally.discardTitle"), t("tally.discardBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.discard"),
        style: "destructive",
        onPress: () => {
          live.discard();
          setFinishing(false);
          leaveLiveScreen();
        },
      },
    ]);
  };

  const minutes = Math.floor(tallyElapsedSeconds(draft, new Date()) / 60);
  const { groups, segment, segments, chips, active, off } = tally;
  const editingClimb = draft.climbs.find((c) => c.key === editing) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gunmetal }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={LIVE_HEADER}>
        <MinimiseButton color={colors.white} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`${t("gyms.gym")}, ${gym?.name ?? t("gyms.noGym")}`}
            style={press({ height: 44, flexDirection: "row", alignItems: "center", gap: 4 })}
          >
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontFamily: fonts.sansSemiBold,
                fontSize: 15,
                color: colors.white,
              }}
            >
              {gym?.name ?? t("gyms.noGym")}
            </Text>
            <View style={{ transform: [{ rotate: "90deg" }] }}>
              <Icon name="chevron" color={colors.white} size={14} strokeWidth={2.2} />
            </View>
          </Pressable>
        </View>
        <Button
          label={exercise ? t("common.done") : t("tally.finish")}
          onPress={exercise ? done : () => setFinishing(true)}
          variant="goldText"
          height={44}
        />
      </View>

      {exercise ? (
        <ExerciseClock clock={tally.clock} rest={rest} />
      ) : (
        <View style={{ alignItems: "center", gap: 2, paddingTop: 4, paddingBottom: 12 }}>
          <LiveClock
            elapsed={(at) => tallyElapsedSeconds(draft, at)}
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: 44,
              lineHeight: 50,
              letterSpacing: -1.3,
              color: colors.white,
            }}
          />
          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {tallySummary(draft)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {groups.every((g) => g.climbs.length === 0) ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 18 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: "rgba(255,255,255,0.72)" }}>
              {t("tally.pickGrade")}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 72 }}
          >
            {groups.map((group) => (
              <React.Fragment key={group.set}>
                {group.label !== "" && (
                  <Text
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.6)",
                      paddingTop: 6,
                      paddingHorizontal: 2,
                    }}
                  >
                    {group.label}
                  </Text>
                )}
                {group.climbs.length === 0 && group.label !== "" && (
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 16,
                      color: "rgba(255,255,255,0.72)",
                      paddingHorizontal: 2,
                      paddingBottom: 6,
                    }}
                  >
                    {t("tally.pickGradeForSet", { set: group.set })}
                  </Text>
                )}
                {group.climbs.map((climb) => (
                  <TallyRow
                    key={climb.key}
                    climb={climb}
                    selected={selection?.kind === "row" && selection.key === climb.key}
                    onPress={() => tally.toggleRow(climb.key)}
                    onEdit={() => setEditing(climb.key)}
                  />
                ))}
              </React.Fragment>
            ))}
          </ScrollView>
        )}
        {snack !== null && (
          <UndoSnackbar
            id={snack.id}
            message={snack.message}
            bottom={12}
            onUndo={tally.undo}
            onExpire={tally.clearSnack}
          />
        )}
      </View>

      <View
        style={{
          gap: 10,
          paddingTop: 12,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.12)",
        }}
      >
        <View
          accessibilityRole="radiogroup"
          style={{
            alignSelf: "center",
            width: segments.length * 96,
            flexDirection: "row",
            padding: 3,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        >
          {segments.map((d) => (
            <Pressable
              key={d}
              onPress={() => tally.pickSegment(d)}
              accessibilityRole="radio"
              accessibilityState={{ checked: d === segment }}
              style={{
                flex: 1,
                height: 30,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: d === segment ? colors.white : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 13,
                  color: d === segment ? colors.gunmetal : "rgba(255,255,255,0.75)",
                }}
              >
                {tally.segmentLabel(d)}
              </Text>
            </Pressable>
          ))}
        </View>
        <GradeChips
          chips={chips}
          active={active}
          startIndex={tally.startIndex}
          onPick={tally.pick}
        />
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 18 }}>
          <Pressable
            onPress={() => tally.go("fell")}
            disabled={off}
            accessibilityRole="button"
            accessibilityState={{ disabled: off }}
            style={press({
              flex: 1,
              height: 72,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.5)",
              alignItems: "center",
              justifyContent: "center",
              opacity: off ? 0.35 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.white }}>
              {t("tally.fell")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => tally.go("sent")}
            disabled={off}
            accessibilityRole="button"
            accessibilityState={{ disabled: off }}
            style={press({
              flex: 1,
              height: 72,
              borderRadius: 16,
              borderWidth: off ? 2 : 0,
              borderColor: "rgba(255,255,255,0.5)",
              backgroundColor: off ? "transparent" : colors.gold,
              alignItems: "center",
              justifyContent: "center",
              opacity: off ? 0.35 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: 18,
                color: off ? colors.white : colors.gunmetal,
              }}
            >
              {t("common.sent")}
            </Text>
          </Pressable>
        </View>
      </View>

      <LiveClimbEditor
        climb={editingClimb}
        index={editingClimb === null ? 0 : draft.climbs.indexOf(editingClimb)}
        count={draft.climbs.length}
        prefs={scales}
        vocabulary={vocabulary}
        gyms={circuitGym === null ? [] : [circuitGym]}
        onChange={(c) => live.updateClimb(c.key, () => c, gyms.gyms)}
        onRemove={() => {
          if (editing !== null)
            live.replace({ ...draft, climbs: draft.climbs.filter((c) => c.key !== editing) });
          tally.clearSelection();
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
      <GymSheet
        visible={picking}
        gyms={gyms.gyms}
        gymId={draft.gymId}
        onPick={(gymId) => {
          tally.pickGym(gymId);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
      <FinishSheet
        visible={finishing}
        summary={finishSummary(draft, minutes)}
        onSave={save}
        onDiscard={discard}
        onClose={() => setFinishing(false)}
      />
    </SafeAreaView>
  );
}
