import React from "react";
import { useNavigate } from "react-router";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import {
  finishedRunParams,
  intervalsView,
  useIntervalsPlayer,
  type IntervalsRun,
} from "@sendtally/features/workouts";
import { playTone } from "../../../lib/tones";
import { useAppApi } from "../../../lib/useAppApi";
import { useLiveRunStore } from "../../../lib/useLiveRun";
import { newActivityPath } from "../../log/paths";
import { SetArrows } from "./SetArrows";
import { StepCard } from "./StepCard";
import { TimerFrame } from "./TimerFrame";
import { UpNext } from "./UpNext";

/** Plays the steps round by round: the step now, what comes next, and pause, restart and skip. */
export function IntervalsPage({
  workout,
  end,
}: {
  workout: IntervalsRun;
  end: boolean;
}): React.ReactElement {
  const navigate = useNavigate();
  const unit = useWeightUnit(useAppApi());
  const timer = useIntervalsPlayer({
    workout,
    store: useLiveRunStore(),
    playSound: playTone,
    end,
    onFinish: (done, off, startedAt) =>
      void navigate(newActivityPath(finishedRunParams(workout, done, startedAt, Date.now(), off)), {
        replace: true,
      }),
  });
  const climbing = workout.kind === "climbing";
  const view = intervalsView(timer.run, workout.body, timer.secondsLeft, unit, climbing);

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
      <div className="timer-middle timer-middle--top">
        <StepCard
          text={view.step}
          color={view.look.fill}
          ariaLabel={view.primary}
          onPress={timer.primary}
        />
        <SetArrows timer={timer} label={view.round} />
        <UpNext items={view.upNext} />
      </div>
    </TimerFrame>
  );
}
