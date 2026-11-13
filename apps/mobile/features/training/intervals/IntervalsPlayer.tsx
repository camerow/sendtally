import React from "react";
import { ScrollView } from "react-native";
import {
  startIntervalsRun,
  type IntervalPhase,
  type Run,
  type WeightUnit,
} from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { SetArrows } from "../timer/SetArrows";
import { TimerFrame } from "../timer/TimerFrame";
import { useTimer } from "../timer/useTimer";
import { liveRun } from "../../live-session/liveRun";
import { intervalsParams, intervalsView, type IntervalsRun } from "@sendtally/features/workouts";
import { StepCard } from "./StepCard";
import { UpNext } from "./UpNext";

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
  const timer = useTimer((now) => {
    const state = liveRun.resumed("/workout/intervals", workout.workoutId)?.state;
    return state?.player === "timer"
      ? (state.run as Run<IntervalPhase>)
      : startIntervalsRun(body, now);
  });
  const { run, secondsLeft } = timer;
  const climbing = workout.kind === "climbing";
  const view = intervalsView(run, body, secondsLeft, unit, climbing);

  React.useEffect(() => {
    liveRun.write({
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

  return (
    <TimerFrame
      timer={timer}
      name={workout.title}
      meta={kindLabel(workout.kind)}
      workoutId={workout.workoutId}
      controls={{
        color: view.look.fill,
        primary: view.primary,
        next: null,
        fail: view.fail,
        onPrimary: timer.primary,
        onFail: timer.fail,
      }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 18 }}>
        <StepCard
          text={view.step}
          color={view.look.fill}
          accessibilityLabel={view.primary}
          onPress={timer.primary}
        />
        <SetArrows timer={timer} label={view.round} />
        <UpNext items={view.upNext} />
      </ScrollView>
    </TimerFrame>
  );
}
