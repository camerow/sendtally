import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { TimerScreen } from "../../features/training/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement {
  const { workoutId, gripId } = useLocalSearchParams<{ workoutId: string; gripId: string }>();
  return (
    <HangDataProvider>
      <TimerScreen workoutId={workoutId} gripId={gripId} />
    </HangDataProvider>
  );
}
