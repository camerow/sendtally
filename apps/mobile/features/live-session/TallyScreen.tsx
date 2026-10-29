import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typicalGradeIndex, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  CIRCUIT_HEX,
  circuitLabel,
  gymOfDraft,
  liveGymOfDraft,
  useGyms,
} from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  disciplineLabel,
  durationLabel,
  finishLiveSession,
  gradeOptions,
  newTallyClimb,
  readClimbKind,
  setGroups,
  setOver,
  tallyDraft,
  tallyElapsedSeconds,
  tallySummary,
  useLiveSession,
  vGradeOf,
  withExerciseClimb,
  withExerciseDone,
  withSetEnded,
  withTallyGo,
  withWallStarted,
  type ClimbDraft,
  type Discipline,
  type LogSessionDraft,
  type TallyChoice,
  type TallyGo,
} from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { useApi } from "../../lib/api";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { press } from "../../lib/press";
import { readPlanLink } from "../training/data/planLinkParams";
import { useRest } from "../training/rest/useRest";
import { ExerciseClock } from "./ExerciseClock";
import { FinishSheet } from "./FinishSheet";
import { GradeChips, type GradeChip } from "../../components/GradeChips";
import { GymSheet } from "./GymSheet";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { LiveClock } from "../../components/LiveClock";
import { TallyRow } from "./TallyRow";
import { UndoSnackbar } from "./UndoSnackbar";

type Selection = { kind: "row"; key: string } | { kind: "pending"; chip: string } | null;

type Segment = Discipline | "circuit";

type Snack = { id: number; message: string; draft: LogSessionDraft; selection: Selection };

const gradeOf = (climb: ClimbDraft): string =>
  climb.circuit === undefined ? climb.grade : circuitLabel(climb.circuit);

function finishSummary(draft: LogSessionDraft, minutes: number): string {
  const sends = draft.climbs.filter((c) => c.kind === "send");
  const top = [...sends].sort(
    (a, b) => (vGradeOf(b.grade, b.scale) ?? -1) - (vGradeOf(a.grade, a.scale) ?? -1)
  )[0];
  return [
    durationLabel(minutes),
    t("tally.sentCount", { count: sends.length }),
    ...(top === undefined ? [] : [t("sessions.topSend", { grade: gradeOf(top) })]),
  ].join(" · ");
}

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
  const params = useLocalSearchParams();
  const plan = readPlanLink(params);
  const live = useLiveSession(exercise ? exerciseTallyStorage : liveSessionStorage);
  const rest = useRest();
  const [now, setNow] = React.useState(() => new Date());
  const gyms = useGyms(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const [held, setHeld] = React.useState<{ set: number | undefined; selection: Selection }>({
    set: undefined,
    selection: null,
  });
  const [snack, setSnack] = React.useState<Snack | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [finishing, setFinishing] = React.useState(params.finish === "1");
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [discipline, setDiscipline] = React.useState<Discipline>(() =>
    readClimbKind(climbKindStorage, []) === "route" ? "route" : "boulder"
  );
  const [onCircuit, setOnCircuit] = React.useState(true);

  const started = React.useRef(false);
  const settled = sessions.status !== "loading" && gyms.state.status !== "loading";
  const draft = live.stored?.draft ?? null;
  const set = draft?.exercise?.set;
  const selection = held.set === set ? held.selection : null;
  const setSelection = (next: Selection, of: number | undefined = set): void =>
    setHeld({ set: of, selection: next });
  React.useEffect(() => {
    if (started.current || !settled) return;
    started.current = true;
    const lastGym =
      sessions.status === "ready"
        ? sessions.data.sessions.find((s) => s.gym_id !== null)?.gym_id
        : undefined;
    const gymId = gyms.gyms.some((g) => g.id === lastGym) ? (lastGym ?? undefined) : undefined;
    if (exercise) {
      if (draft !== null && draft.gymId === undefined && draft.climbs.length === 0 && gymId)
        live.replace({ ...draft, gymId });
      return;
    }
    if (draft !== null) return;
    const name = typeof params.name === "string" ? params.name : undefined;
    live.start(tallyDraft(new Date(), { gymId, plan, name }));
  }, [settled, draft, live, plan, params.name, sessions, gyms.gyms, exercise]);

  React.useEffect(() => {
    if (!exercise) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [exercise]);

  /** A set over ends, and its rest starts. */
  const settle = React.useCallback(
    (next: LogSessionDraft, at: Date): LogSessionDraft => {
      if (!setOver(next, at)) return next;
      const ended = withSetEnded(next);
      if (ended.restS > 0) rest.tick("tally", ended.restS);
      return ended.draft;
    },
    [rest]
  );

  const open = selection?.kind === "pending";
  React.useEffect(() => {
    if (draft === null || open || !setOver(draft, now)) return;
    live.replace(settle(draft, now));
  }, [draft, open, now, live, settle]);

  const leave = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/sessions");
  };

  if (draft === null || (exercise && draft.exercise === undefined)) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.gunmetal }} />;
  }

  const gym = gymOfDraft(gyms.gyms, draft.gymId);
  const circuitGym = liveGymOfDraft(gyms.gyms, draft.gymId);
  const scale = scales[discipline];
  const segment: Segment = circuitGym !== null && onCircuit ? "circuit" : discipline;
  const segments: Segment[] =
    circuitGym === null ? ["boulder", "route"] : ["boulder", "route", "circuit"];
  const chips: GradeChip[] =
    segment === "circuit" && circuitGym !== null
      ? circuitGym.circuits.map((c) => ({
          key: c.id,
          label: circuitLabel(c),
          colour: CIRCUIT_HEX[c.colour],
        }))
      : gradeOptions(scale).map((g) => ({ key: g, label: g }));

  const choiceOf = (chip: string): TallyChoice | null => {
    if (segment !== "circuit" || circuitGym === null) return { kind: "grade", scale, grade: chip };
    const circuit = circuitGym.circuits.find((c) => c.id === chip);
    return circuit === undefined ? null : { kind: "circuit", gym: circuitGym, circuit };
  };

  const commit = (next: LogSessionDraft): void => live.replace(settle(next, new Date()));

  const go = (g: TallyGo): void => {
    let climb: ClimbDraft | undefined;
    if (selection?.kind === "pending") {
      const choice = choiceOf(selection.chip);
      if (choice === null) return;
      const next = newTallyClimb(draft, choice, g);
      setSelection(g === "fell" ? { kind: "row", key: next.key } : null);
      commit(withExerciseClimb(next.draft, next.key));
      climb = next.draft.climbs.find((c) => c.key === next.key);
    } else if (selection?.kind === "row") {
      climb = draft.climbs.find((c) => c.key === selection.key);
      if (climb === undefined) return;
      const key = selection.key;
      if (g === "sent") setSelection(null);
      commit({
        ...draft,
        climbs: draft.climbs.map((c) => (c.key === key ? withTallyGo(c, g) : c)),
      });
    }
    if (climb === undefined) return;
    const grade = gradeOf(climb);
    setSnack({
      id: (snack?.id ?? 0) + 1,
      message: g === "fell" ? t("tally.fellOn", { grade }) : t("tally.sentGrade", { grade }),
      draft,
      selection,
    });
  };

  const undo = (): void => {
    if (snack === null) return;
    if (snack.draft.exercise?.set !== draft.exercise?.set) rest.skip();
    live.replace(snack.draft);
    setSelection(snack.selection, snack.draft.exercise?.set);
    setSnack(null);
  };

  const pickGym = (gymId: string | undefined): void => {
    const { gymId: _gym, ...rest } = draft;
    live.replace(gymId === undefined ? rest : { ...rest, gymId });
    setOnCircuit(true);
    setSelection(null);
    setPicking(false);
  };

  const pickSegment = (next: Segment): void => {
    setOnCircuit(next === "circuit");
    if (next !== "circuit") {
      setDiscipline(next);
      climbKindStorage.write(next);
    }
    setSelection(null);
  };

  const save = (rpe: number | null): void => {
    setSaving(true);
    setFailed(false);
    finishLiveSession(api, liveSessionStorage, rpe).then(
      (fingerprint) => {
        setFinishing(false);
        if (fingerprint === null) leave();
        else router.replace({ pathname: "/session/[fingerprint]", params: { fingerprint } });
      },
      () => {
        setSaving(false);
        setFailed(true);
      }
    );
  };

  const pick = (chip: string): void => {
    rest.skip();
    setSelection({ kind: "pending", chip });
    const wall = withWallStarted(draft, new Date());
    if (wall !== draft) live.replace(wall);
  };

  const done = (): void => {
    rest.skip();
    live.replace(withExerciseDone(draft));
    leave();
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
          leave();
        },
      },
    ]);
  };

  const minutes = Math.floor(tallyElapsedSeconds(draft, new Date()) / 60);
  const groups = exercise
    ? setGroups(draft)
    : [{ set: 0, label: "", climbs: [...draft.climbs].reverse() }];
  const editingClimb = draft.climbs.find((c) => c.key === editing) ?? null;
  const active = selection?.kind === "pending" ? selection.chip : null;
  const off = selection === null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gunmetal }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 6,
          paddingHorizontal: 8,
        }}
      >
        <Pressable
          onPress={leave}
          accessibilityRole="button"
          accessibilityLabel={t("tally.minimise")}
          style={press({ width: 60, height: 44, alignItems: "center", justifyContent: "center" })}
        >
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <Icon name="chevron" color={colors.white} size={22} strokeWidth={2.2} />
          </View>
        </Pressable>
        <Pressable
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t("gyms.gym")}, ${gym?.name ?? t("gyms.noGym")}`}
          style={press({ height: 44, flexDirection: "row", alignItems: "center", gap: 4 })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {gym?.name ?? t("gyms.noGym")}
          </Text>
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <Icon name="chevron" color={colors.white} size={14} strokeWidth={2.2} />
          </View>
        </Pressable>
        <Pressable
          onPress={exercise ? done : () => setFinishing(true)}
          accessibilityRole="button"
          style={press({
            width: 76,
            height: 44,
            alignItems: "flex-end",
            justifyContent: "center",
            paddingRight: 10,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gold }}>
            {exercise ? t("common.done") : t("tally.finish")}
          </Text>
        </Pressable>
      </View>

      {exercise ? (
        <ExerciseClock draft={draft} rest={rest} now={now} />
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
                    onPress={() =>
                      setSelection(
                        selection?.kind === "row" && selection.key === climb.key
                          ? null
                          : { kind: "row", key: climb.key }
                      )
                    }
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
            onUndo={undo}
            onExpire={() => setSnack(null)}
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
              onPress={() => pickSegment(d)}
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
                {d === "circuit" ? t("gyms.circuit") : disciplineLabel(d)}
              </Text>
            </Pressable>
          ))}
        </View>
        <GradeChips
          chips={chips}
          active={active}
          startIndex={segment === "circuit" ? 0 : typicalGradeIndex(vocabulary.climbs, scale)}
          onPick={pick}
        />
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 18 }}>
          <Pressable
            onPress={() => go("fell")}
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
            onPress={() => go("sent")}
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
          setSelection(null);
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
      <GymSheet
        visible={picking}
        gyms={gyms.gyms}
        gymId={draft.gymId}
        onPick={pickGym}
        onClose={() => setPicking(false)}
      />
      <FinishSheet
        visible={finishing}
        summary={finishSummary(draft, minutes)}
        saving={saving}
        failed={failed}
        onSave={save}
        onDiscard={discard}
        onClose={() => setFinishing(false)}
      />
    </SafeAreaView>
  );
}
