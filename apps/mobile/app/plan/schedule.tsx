import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { ScheduleScreen } from "../../features/training/planning/ScheduleScreen";

export default function ScheduleRoute(): React.ReactElement {
  const { workoutId, exerciseId } = useLocalSearchParams<{
    workoutId?: string;
    exerciseId?: string;
  }>();
  return (
    <HangDataProvider>
      <ScheduleScreen workoutId={workoutId} exerciseId={exerciseId} />
    </HangDataProvider>
  );
}
