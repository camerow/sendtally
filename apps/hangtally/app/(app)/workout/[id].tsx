import { useLocalSearchParams } from "expo-router";
import React from "react";
import { WorkoutDetailScreen } from "../../../features/workout-detail/WorkoutDetailScreen";

export default function WorkoutRoute(): React.ReactElement | null {
  const { id, grip } = useLocalSearchParams<{ id: string; grip?: string }>();
  return <WorkoutDetailScreen id={id} grip={grip} />;
}
