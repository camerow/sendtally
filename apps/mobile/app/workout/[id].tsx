import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutScreen } from "../../features/training/library-detail/WorkoutScreen";

export default function WorkoutRoute(): React.ReactElement {
  const { id, grip } = useLocalSearchParams<{ id: string; grip?: string }>();
  return (
    <HangDataProvider>
      <WorkoutScreen id={id} grip={grip} />
    </HangDataProvider>
  );
}
