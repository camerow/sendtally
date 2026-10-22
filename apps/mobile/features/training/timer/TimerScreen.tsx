import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import {
  currentPhase,
  isWork,
  protocolOf,
  resultOf,
  startRun,
  type HangSetup,
  type HangWorkout,
  type PlanLink,
} from "@sendtally/core/hang";
import { loadLabel, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { ON_DARK_SOFT } from "../components/onDark";
import { useHangData } from "../data/HangDataContext";
import { usePlannedRun } from "./usePlannedRun";
import { donePath } from "../done/doneParams";
import { type } from "../type";
import { phaseLook } from "./phaseLook";
import { RepDots } from "./RepDots";
import { SetupStep } from "./SetupStep";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";
import { timerText } from "./timerText";
import { useTimer } from "./useTimer";

function Timer({
  workout,
  gripId,
  setup,
  link,
}: {
  workout: HangWorkout;
  gripId: string;
  setup: HangSetup;
  link: PlanLink;
}): React.ReactElement {
  const { edgeMm, loadKg } = setup;
  const { model } = useHangData();
  const timer = useTimer((now) => startRun(protocolOf(workout), now));
  const { run, secondsLeft, progress } = timer;
  const phase = currentPhase(run);
  const pull = phase.kind === "pull";
  const working = isWork(phase.kind);
  const load = loadLabel(workout.kind, loadKg, model.settings.units);
  const text = timerText(run, secondsLeft, load);
  const look = phaseLook(working, phase.kind === "ready");

  React.useEffect(() => {
    if (run.finished !== null)
      router.replace(
        donePath({ workoutId: workout.id, gripId, edgeMm, loadKg, result: resultOf(run), link })
      );
  }, [run, workout.id, gripId, edgeMm, loadKg, link]);

  const lift = (ok: boolean): void => {
    timer.play(ok ? "lift" : "miss");
    timer.logLift(ok);
  };
  const primary = pull ? () => lift(true) : timer.togglePause;

  return (
    <TimerFrame
      timer={timer}
      name={workout.name}
      meta={`${model.gripName(gripId)} · ${setupLabel(workout.kind, setup, model.settings.units)}`}
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
          <RepDots reps={workout.reps} marks={run.marks} working={working} />
        </View>
      </View>
    </TimerFrame>
  );
}

export type TimerScreenProps = { workoutId: string; gripId: string; link: PlanLink };

export function TimerScreen({
  workoutId,
  gripId,
  link,
}: TimerScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const planned = usePlannedRun(workoutId, link);
  const [setup, setSetup] = React.useState<HangSetup | null>(null);
  if (planned === undefined) return null;
  const { workout, dose } = planned;
  return setup === null ? (
    <SetupStep
      workout={workout}
      gripId={gripId}
      initial={model.setup(workout, gripId, dose)}
      onStart={setSetup}
    />
  ) : (
    <Timer workout={workout} gripId={gripId} setup={setup} link={link} />
  );
}
