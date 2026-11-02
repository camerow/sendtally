import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  currentPhase,
  isWork,
  protocolDose,
  protocolOf,
  setsHeld,
  startWorkoutRun,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
  type SetDone,
} from "@sendtally/core/hang";
import { kindLabel, setKeyOf } from "@sendtally/features/activities";
import { loadLabel, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockTagOf, usePlan } from "@sendtally/features/training";
import { Icon } from "../../../components/Icon";
import { useApi } from "../../../lib/api";
import { press } from "../../../lib/press";
import { ON_DARK, ON_DARK_LINE, ON_DARK_SOFT } from "../components/onDark";
import { WorkoutNotes } from "../components/WorkoutNotes";
import { type } from "../type";
import { useHangData } from "../data/HangDataContext";
import { usePlannedRun, type PlannedRun } from "./usePlannedRun";
import { donePath } from "../done/doneParams";
import { phaseLook } from "./phaseLook";
import { RepDots } from "./RepDots";
import { SetArrows } from "./SetArrows";
import { ForTodaySheet, type TodayEntry } from "./ForTodaySheet";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";
import { timerText } from "./timerText";
import { useTimer } from "./useTimer";
import { resumedRun, writeLiveRun } from "../../live-session/liveRun";
import { timerParams } from "./startWorkout";

function Timer({
  planned,
  grips,
  setups,
  entries,
  onSetups,
  link,
  session,
  resumed,
  end,
}: {
  planned: PlannedRun;
  grips: readonly string[];
  setups: HangSetup[];
  entries: readonly TodayEntry[];
  onSetups: (setups: HangSetup[]) => void;
  link: PlanLink;
  session: number;
  /** Where the run was when it was minimised or the app closed. */
  resumed: Run<HangPhase> | null;
  /** Ends the run as it opens, for its review. */
  end: boolean;
}): React.ReactElement {
  const { model, today } = useHangData();
  const plan = usePlan(useApi()).state;
  const [changing, setChanging] = React.useState(false);
  const { items, exerciseRestS } = planned;
  const workout = items[0].workout;
  const timer = useTimer(
    (now) =>
      resumed ??
      startWorkoutRun(
        items.map((i) => protocolOf(i.workout)),
        exerciseRestS,
        now
      )
  );
  const { run, secondsLeft, progress } = timer;
  const phase = currentPhase(run);
  const current = (items[phase.item] ?? items[0]).workout;
  const setup = setups[phase.item] ?? { edgeMm: 0, loadKg: 0 };
  const gripId = grips[phase.item] ?? current.grip;
  const pull = phase.taps > 0;
  const working = isWork(phase.kind);
  const load = loadLabel(current.kind, setup.loadKg, model.settings.units);
  const text = timerText(run, secondsLeft, load, current.sets);
  const look = phaseLook(working, phase.kind === "ready" && run.index === 0);

  React.useEffect(() => {
    writeLiveRun({
      title: workout.name,
      workoutId: workout.id,
      pathname: "/workout/timer",
      params: timerParams(workout.id, grips[0] ?? workout.grip, session, link),
      startedAt: run.startedAt,
      state: { player: "timer", run, setups },
    });
  }, [run, workout, grips, session, link, setups]);

  const ending = React.useRef(end);
  React.useEffect(() => {
    if (!ending.current) return;
    ending.current = false;
    timer.end();
  }, [timer]);

  const sent = React.useRef(false);
  React.useEffect(() => {
    if (run.finished === null || sent.current) return;
    sent.current = true;
    const doses = items.map((i) => protocolDose(i.workout));
    const held = setsHeld(run, doses);
    const planned = (item: number): SetDone => {
      const { sets: _, ...dose } = doses[item] ?? { sets: 0 };
      return dose;
    };
    router.replace(
      donePath({
        workoutId: workout.id,
        gripId: grips[0] ?? workout.grip,
        link,
        session,
        run: {
          done: held.map((sets, item) => ({
            item,
            exercise: grips[item] ?? "",
            sets: sets.map((s) => s ?? planned(item)),
          })),
          off: held.flatMap((sets, item) =>
            sets.flatMap((s, set) => (s === null ? [setKeyOf(item, set)] : []))
          ),
          setups,
          startedAt: run.startedAt,
        },
      })
    );
  }, [run, items, workout, grips, setups, link, session]);

  const lift = (ok: boolean): void => {
    timer.play(ok ? "lift" : "miss");
    timer.logLift(ok);
  };
  const primary = pull ? () => lift(true) : timer.togglePause;

  return (
    <TimerFrame
      timer={timer}
      name={workout.name}
      meta={kindLabel("hangboard")}
      workoutId={workout.id}
      controls={{
        color: look.fill,
        primary: pull
          ? t("hang.lifted")
          : run.pausedAt === null
            ? t("hang.pause")
            : t("hang.resume"),
        next: text.next,
        fail: working && run.pausedAt === null ? text.fail : null,
        onPrimary: primary,
        onFail: pull ? () => lift(false) : timer.cameOffEarly,
      }}
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => setChanging(true)}
          accessibilityRole="button"
          accessibilityLabel={t("hang.changeToday")}
          style={press({
            height: 36,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: ON_DARK_LINE,
          })}
        >
          <Text style={[type.mono, { fontSize: 13, color: ON_DARK }]}>
            {`${model.gripName(gripId)} · ${setupLabel(current.kind, setup, model.settings.units)}`}
          </Text>
          <Icon name="pencil" size={14} strokeWidth={2} color={ON_DARK_SOFT} />
        </Pressable>
        <WorkoutNotes workoutId={workout.id} dark />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
        <TimerRing
          progress={progress}
          color={look.mark}
          labelColor={look.fill}
          phaseKey={run.index}
          label={text.label}
          big={text.big}
          hint={text.hint}
          accessibilityLabel={
            pull ? t("hang.logLift") : run.pausedAt === null ? t("hang.pause") : t("hang.resume")
          }
          onPress={primary}
        />
        <View style={{ alignItems: "center", gap: 10 }}>
          <SetArrows timer={timer} label={text.setLine} />
          <RepDots reps={current.reps} marks={run.marks} working={working} />
        </View>
      </View>
      {changing && (
        <ForTodaySheet
          kicker={[
            model.gripName(grips[0] ?? workout.grip),
            ...(plan.status === "ready"
              ? [blockTagOf(plan.data, link.membershipId, today)].filter((x) => x !== null)
              : []),
          ].join(" · ")}
          entries={entries}
          setups={setups}
          onChange={onSetups}
          onClose={() => setChanging(false)}
        />
      )}
    </TimerFrame>
  );
}

export type TimerScreenProps = {
  workoutId: string;
  gripId: string;
  link: PlanLink;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** Ends the running workout as it opens, straight to its review. */
  end?: boolean;
};

export function TimerScreen({
  workoutId,
  gripId,
  link,
  session,
  end = false,
}: TimerScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const planned = usePlannedRun(workoutId, link, session);
  const [resumed] = React.useState(() => {
    const state = resumedRun("/workout/timer", workoutId)?.state;
    return state?.player === "timer" ? state : null;
  });
  const [setups, setSetups] = React.useState<HangSetup[] | null>(resumed?.setups ?? null);
  if (planned === undefined) return null;
  const grips = planned.items.map((item, i) => (i === 0 ? gripId : item.workout.grip));
  const entries = planned.items.map(({ workout, dose }, i): TodayEntry => ({
    gripId: grips[i] ?? workout.grip,
    kind: workout.kind,
    planned: model.setup(workout, grips[i] ?? workout.grip, dose),
  }));
  return (
    <Timer
      planned={planned}
      grips={grips}
      setups={setups ?? entries.map((e) => e.planned)}
      entries={entries}
      onSetups={setSetups}
      link={link}
      session={session}
      resumed={(resumed?.run as Run<HangPhase> | undefined) ?? null}
      end={end}
    />
  );
}
