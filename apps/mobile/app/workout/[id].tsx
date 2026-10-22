import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutDetailScreen } from "../../features/training/workout-detail/WorkoutDetailScreen";

export default function WorkoutRoute(): React.ReactElement {
  const { id, grip } = useLocalSearchParams<{ id: string; grip?: string }>();
  return (
    <HangDataProvider>
      <WorkoutDetailScreen id={id} grip={grip} />
    </HangDataProvider>
  );
}
