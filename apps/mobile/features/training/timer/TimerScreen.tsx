import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import {
  currentPhase,
  isWork,
  protocolOf,
  resultOf,
  setsDoneByItem,
  startWorkoutRun,
  type HangPhase,
  type HangSetup,
  type PlanLink,
  type Run,
} from "@sendtally/core/hang";
import { loadLabel, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { ON_DARK_SOFT } from "../components/onDark";
import { useHangData } from "../data/HangDataContext";
import { usePlannedRun, type PlannedRun } from "./usePlannedRun";
import { donePath } from "../done/doneParams";
import { type } from "../type";
import { phaseLook } from "./phaseLook";
import { RepDots } from "./RepDots";
import { SetupStep } from "./SetupStep";
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
  link,
  session,
  resumed,
  end,
}: {
  planned: PlannedRun;
  grips: readonly string[];
  setups: HangSetup[];
  link: PlanLink;
  session: number;
  /** Where the run was when it was minimised or the app closed. */
  resumed: Run<HangPhase> | null;
  /** Ends the run as it opens, for its review. */
  end: boolean;
}): React.ReactElement {
  const { model } = useHangData();
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
    const [first = 0, ...rest] = setsDoneByItem(
      run,
      items.map((i) => i.workout.sets)
    );
    const [setup0 = { edgeMm: 0, loadKg: 0 }, ...more] = setups;
    router.replace(
      donePath({
        workoutId: workout.id,
        gripId: grips[0] ?? workout.grip,
        ...setup0,
        result: { ...resultOf(run), setsDone: first },
        link,
        session,
        more: more.map((s, k) => ({ ...s, setsDone: rest[k] ?? 0 })),
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
      meta={`${model.gripName(gripId)} · ${setupLabel(current.kind, setup, model.settings.units)}`}
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
          <Text style={[type.label, { color: ON_DARK_SOFT }]}>{text.setLine}</Text>
          <RepDots reps={current.reps} marks={run.marks} working={working} />
        </View>
      </View>
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
  return setups === null ? (
    <SetupStep
      name={planned.items[0].workout.name}
      workoutId={workoutId}
      entries={planned.items.map(({ workout, dose }, i) => {
        const grip = i === 0 ? gripId : workout.grip;
        return { gripId: grip, kind: workout.kind, initial: model.setup(workout, grip, dose) };
      })}
      onStart={setSetups}
    />
  ) : (
    <Timer
      planned={planned}
      grips={grips}
      setups={setups}
      link={link}
      session={session}
      resumed={(resumed?.run as Run<HangPhase> | undefined) ?? null}
      end={end}
    />
  );
}
