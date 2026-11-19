import React from "react";
import { ScrollView, Text } from "react-native";
import type { ItemDone, WeightUnit } from "@sendtally/core/hang";
import { type } from "../type";
import { TimerFrame } from "../timer/TimerFrame";
import { useTimer } from "../timer/useTimer";
import { useTimerSounds } from "../timer/useTimerSounds";
import { liveRun } from "../../live-session/liveRun";
import {
  ON_DARK,
  intervalsView,
  useIntervalsPlayer,
  type IntervalsRun,
} from "@sendtally/features/workouts";
import { StepCard } from "./StepCard";
import { UpNext } from "./UpNext";

export type IntervalsPlayerProps = {
  workout: IntervalsRun;
  unit: WeightUnit;
  /** Ends the run as it opens, for its review. */
  end: boolean;
  onFinish: (done: ItemDone[], off: string[], startedAt: number) => void;
};

/** Plays the steps round by round: the step now, the steps to come, and the timer's controls. */
export function IntervalsPlayer({
  workout,
  unit,
  end,
  onFinish,
}: IntervalsPlayerProps): React.ReactElement {
  const { body } = workout;
  const playSound = useTimerSounds();
  const timer = useTimer(useIntervalsPlayer({ workout, store: liveRun, playSound, end, onFinish }));
  const { run, secondsLeft } = timer;
  const climbing = workout.kind === "climbing";
  const view = intervalsView(run, body, secondsLeft, unit, climbing);

  return (
    <TimerFrame timer={timer} controls={{ color: view.look.fill, primary: view.primary }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 18 }}>
        <StepCard
          text={view.step}
          color={view.look.fill}
          accessibilityLabel={view.primary}
          onPress={timer.primary}
        />
        <Text style={[type.monoBold, { fontSize: 15, textAlign: "center", color: ON_DARK }]}>
          {view.round}
        </Text>
        <UpNext items={view.upNext} />
      </ScrollView>
    </TimerFrame>
  );
}
