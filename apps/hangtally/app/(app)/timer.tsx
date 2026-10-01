import { useLocalSearchParams } from "expo-router";
import React from "react";
import { TimerScreen } from "../../features/timer/TimerScreen";

export default function TimerRoute(): React.ReactElement | null {
  const { workoutId, gripId } = useLocalSearchParams<{ workoutId: string; gripId: string }>();
  return <TimerScreen workoutId={workoutId} gripId={gripId} />;
}
