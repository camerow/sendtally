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
import { focusLabel } from "@sendtally/features/training";
import { phaseLook } from "../timer/phaseLook";
import { SetArrows } from "../timer/SetArrows";
import { TimerFrame } from "../timer/TimerFrame";
import { useTimer } from "../timer/useTimer";
import { resumedRun, writeLiveRun } from "../../live-session/liveRun";
import { intervalsParams, type IntervalsRun } from "./intervalsParams";
import { stepText, upNext } from "./intervalsText";
import { StepCard } from "./StepCard";
import { UpNext } from "./UpNext";
import { useRunWorkout } from "../library/useLibrary";

export type IntervalsPlayerProps = {
  workout: IntervalsRun;
  unit: WeightUnit;
  /** Ends the run as it opens, for its review. */
  end: boolean;
  onFinish: (run: Run<IntervalPhase>) => void;
};

/** Plays the steps round by round: the step now, what comes next, and pause, restart and skip. */
export function IntervalsPlayer({
  workout,
  unit,
  end,
  onFinish,
}: IntervalsPlayerProps): React.ReactElement {
  const { body } = workout;
  const targetRpe = useRunWorkout(workout.workoutId)?.targetRpe;
  const timer = useTimer((now) => {
    const state = resumedRun("/workout/intervals", workout.workoutId)?.state;
    return state?.player === "timer"
      ? (state.run as Run<IntervalPhase>)
      : startIntervalsRun(body, now);
  });
  const { run, secondsLeft } = timer;
  const phase = currentPhase(run);
  const tapped = phase.taps > 0;
  const working = isWork(phase.kind);
  const paused = run.pausedAt !== null;
  const look = phaseLook(working, phase.kind === "ready");
  const climbing = workout.kind === "climbing";

  React.useEffect(() => {
    writeLiveRun({
      title: workout.title,
      workoutId: workout.workoutId,
      pathname: "/workout/intervals",
      params: intervalsParams(workout),
      startedAt: run.startedAt,
      state: { player: "timer", run, ...(climbing ? { laps: true } : {}) },
    });
    if (run.finished !== null) onFinish(run);
  }, [run, workout, climbing, onFinish]);

  const ending = React.useRef(end);
  React.useEffect(() => {
    if (!ending.current) return;
    ending.current = false;
    timer.end();
  }, [timer]);

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
      meta={[
        kindLabel(workout.kind),
        ...(workout.link.focus === null ? [] : [focusLabel(workout.link.focus)]),
        ...(targetRpe == null ? [] : [t("plan.targetValue", { n: targetRpe })]),
      ].join(" · ")}
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
          text={stepText(run, body, secondsLeft, unit, climbing)}
          color={look.fill}
          accessibilityLabel={primaryLabel}
          onPress={primary}
        />
        <SetArrows
          timer={timer}
          label={
            climbing
              ? t("tally.lapOf", { set: phase.set, sets: body.rounds })
              : t("activities.roundOf", { round: phase.set, rounds: body.rounds })
          }
        />
        <UpNext items={upNext(run, body)} />
      </ScrollView>
    </TimerFrame>
  );
}
