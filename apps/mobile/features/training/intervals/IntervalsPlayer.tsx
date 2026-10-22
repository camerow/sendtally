import React from "react";
import { ScrollView } from "react-native";
import {
  currentPhase,
  isWork,
  startIntervalsRun,
  type IntervalPhase,
  type Run,
  type WeightUnit,
} from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { phaseLook } from "../timer/phaseLook";
import { TimerFrame } from "../timer/TimerFrame";
import { useTimer } from "../timer/useTimer";
import type { IntervalsRun } from "./intervalsParams";
import { stepText, upNext } from "./intervalsText";
import { StepCard } from "./StepCard";
import { UpNext } from "./UpNext";

export type IntervalsPlayerProps = {
  workout: IntervalsRun;
  unit: WeightUnit;
  onFinish: (run: Run<IntervalPhase>) => void;
};

/** Plays the steps round by round: the step now, what comes next, and pause, restart and skip. */
export function IntervalsPlayer({
  workout,
  unit,
  onFinish,
}: IntervalsPlayerProps): React.ReactElement {
  const { body } = workout;
  const timer = useTimer((now) => startIntervalsRun(body, now));
  const { run, secondsLeft } = timer;
  const phase = currentPhase(run);
  const tapped = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  const look = phaseLook(working, phase.kind === "ready");

  React.useEffect(() => {
    if (run.finished !== null) onFinish(run);
  }, [run, onFinish]);

  const primary = tapped
    ? () => {
        timer.play("lift");
        timer.logLift(true);
      }
    : timer.togglePause;
  const primaryLabel = tapped ? t("common.done") : paused ? t("hang.resume") : t("hang.pause");
  const held = Math.max(0, phase.seconds - secondsLeft);

  return (
    <TimerFrame
      timer={timer}
      name={workout.title}
      meta={`${kindLabel(workout.kind)} · ${t("activities.roundOf", { round: phase.set, rounds: body.rounds })}`}
      controls={{
        color: look.fill,
        primary: primaryLabel,
        next: null,
        fail: working && !tapped && !paused ? t("activities.stoppedEarly", { n: held }) : null,
        onPrimary: primary,
        onFail: timer.cameOffEarly,
      }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 18 }}>
        <StepCard
          text={stepText(run, body, secondsLeft, unit)}
          color={look.fill}
          accessibilityLabel={primaryLabel}
          onPress={primary}
        />
        <UpNext items={upNext(run, body)} />
      </ScrollView>
    </TimerFrame>
  );
}
