import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import {
  currentPhase,
  isWork,
  protocolOf,
  resultOf,
  startRun,
  type Workout,
} from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { ON_DARK_SOFT } from "../components/onDark";
import { useHangData } from "../data/HangDataContext";
import { donePath } from "../done/doneParams";
import { type } from "../type";
import { RepDots } from "./RepDots";
import { TimerFrame } from "./TimerFrame";
import { TimerRing } from "./TimerRing";
import { timerText } from "./timerText";
import { useTimer } from "./useTimer";

function Timer({
  workout,
  gripId,
  loadKg,
}: {
  workout: Workout;
  gripId: string;
  loadKg: number;
}): React.ReactElement {
  const { model } = useHangData();
  const timer = useTimer((now) => startRun(protocolOf(workout), now));
  const { run, secondsLeft, progress } = timer;
  const phase = currentPhase(run);
  const pull = phase.kind === "pull";
  const working = isWork(phase.kind);
  const load = loadLabel(workout.kind, loadKg, model.settings.units);
  const text = timerText(run, secondsLeft, load);
  const color = working ? colors.gold : phase.kind === "ready" ? colors.petalTint : colors.petal;

  React.useEffect(() => {
    if (run.finished !== null)
      router.replace(donePath({ workoutId: workout.id, gripId, loadKg, result: resultOf(run) }));
  }, [run, workout.id, gripId, loadKg]);

  const lift = (ok: boolean): void => {
    timer.play(ok ? "lift" : "miss");
    timer.logLift(ok);
  };
  const primary = pull ? () => lift(true) : timer.togglePause;

  return (
    <TimerFrame
      timer={timer}
      name={workout.name}
      meta={`${model.gripName(gripId)} · ${load}`}
      controls={{
        color,
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
          color={color}
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

export type TimerScreenProps = { workoutId: string; gripId: string };

export function TimerScreen({ workoutId, gripId }: TimerScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const workout = model.workout(workoutId);
  const [loadKg] = React.useState(() => (workout === undefined ? 0 : model.load(workout, gripId)));
  return workout === undefined ? null : <Timer workout={workout} gripId={gripId} loadKg={loadKg} />;
}
