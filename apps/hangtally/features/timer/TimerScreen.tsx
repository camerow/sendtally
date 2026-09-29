import { router } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { currentPhase, isWork, protocolOf, resultOf, type Workout } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { donePath } from "../done/doneParams";
import { RepDots } from "./RepDots";
import { RunProgressBar } from "./RunProgressBar";
import { TimerControls } from "./TimerControls";
import { TimerHeader } from "./TimerHeader";
import { TimerRing } from "./TimerRing";
import { timerText } from "./timerText";
import { usePhaseProgress } from "./usePhaseProgress";
import { useRun } from "./useRun";
import { useTimerSounds } from "./useTimerSounds";

function Timer({
  workout,
  gripId,
  loadKg,
}: {
  workout: Workout;
  gripId: string;
  loadKg: number;
}): React.ReactElement {
  useKeepAwake();
  const c = useTheme();
  const { model } = useHangData();
  const [muted, setMuted] = React.useState(false);
  const controls = useRun(protocolOf(workout));
  const { run, secondsLeft } = controls;
  const progress = usePhaseProgress(run);
  const play = useTimerSounds(run, secondsLeft, muted);
  const phase = currentPhase(run);
  const pull = phase.kind === "pull";
  const working = isWork(phase.kind);
  const load = loadLabel(workout.kind, loadKg, model.settings.units);
  const text = timerText(run, secondsLeft, load);
  const color = working ? c.accent : phase.kind === "ready" ? c.onDark : c.rest;

  React.useEffect(() => {
    if (run.finished !== null)
      router.replace(donePath({ workoutId: workout.id, gripId, loadKg, result: resultOf(run) }));
  }, [run, workout.id, gripId, loadKg]);

  const lift = (ok: boolean): void => {
    play(ok ? "lift" : "miss");
    controls.logLift(ok);
  };
  const primary = pull ? () => lift(true) : controls.togglePause;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: c.deep }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <TimerHeader
          name={workout.name}
          meta={`${model.gripName(gripId)} · ${load}`}
          muted={muted}
          onEnd={controls.end}
          onToggleMute={() => setMuted(!muted)}
        />
        <View style={{ paddingTop: 22 }}>
          <RunProgressBar run={run} progress={progress} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 26 }}>
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
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={[type.monoBold, { fontSize: 16, color: c.onDark }]}>{text.setLine}</Text>
            <RepDots reps={run.protocol.reps} marks={run.marks} working={working} />
          </View>
        </View>
        <TimerControls
          color={color}
          primary={
            pull ? t("hang.lifted") : run.pausedAt === null ? t("hang.pause") : t("hang.resume")
          }
          next={text.next}
          fail={working && run.pausedAt === null ? text.fail : null}
          onPrimary={primary}
          onFail={pull ? () => lift(false) : controls.cameOffEarly}
          onRestart={controls.restart}
          onSkip={controls.skip}
        />
      </View>
    </SafeAreaView>
  );
}

export type TimerScreenProps = { workoutId: string; gripId: string };

export function TimerScreen({ workoutId, gripId }: TimerScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const workout = model.workout(workoutId);
  const [loadKg] = React.useState(() => (workout === undefined ? 0 : model.load(workout, gripId)));
  return workout === undefined ? null : <Timer workout={workout} gripId={gripId} loadKg={loadKg} />;
}
