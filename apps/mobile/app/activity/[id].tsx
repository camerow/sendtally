import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutSummaryScreen } from "../../features/training/summary/WorkoutSummaryScreen";

export default function WorkoutSummaryRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HangDataProvider framed>
      <WorkoutSummaryScreen id={id ?? ""} />
    </HangDataProvider>
  );
}
