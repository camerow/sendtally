import React from "react";
import { useHangData } from "../../data/HangDataContext";
import { useNavigate } from "react-router";
import {
  finishedRunParams,
  intervalsView,
  useIntervalsPlayer,
  type IntervalsRun,
} from "@sendtally/features/workouts";
import { playTone } from "../../../lib/tones";
import { useLiveRunStore } from "../../../lib/useLiveRun";
import { newActivityPath } from "../../log/paths";
import { StepCard } from "./StepCard";
import { TimerFrame } from "./TimerFrame";
import { UpNext } from "./UpNext";

/** Plays the steps round by round: the step now, the steps to come, and the timer's controls. */
export function IntervalsPage({
  workout,
  end,
}: {
  workout: IntervalsRun;
  end: boolean;
}): React.ReactElement {
  const navigate = useNavigate();
  const unit = useHangData().model.settings.units;
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
  const view = intervalsView(timer.run, workout.body, timer.secondsLeft, unit);

  return (
    <TimerFrame timer={timer} controls={{ color: view.look.fill, primary: view.primary }}>
      <div className="timer-middle timer-middle--top">
        <StepCard
          text={view.step}
          color={view.look.fill}
          ariaLabel={view.primary}
          onPress={timer.primary}
        />
        <span className="timer-set-line">{view.round}</span>
        <UpNext items={view.upNext} />
      </div>
    </TimerFrame>
  );
}
