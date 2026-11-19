import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutHistoryScreen } from "../../features/training/history/WorkoutHistoryScreen";

export default function WorkoutHistoryRoute(): React.ReactElement {
  const { id, current } = useLocalSearchParams<{ id: string; current?: string }>();
  return (
    <HangDataProvider framed>
      <WorkoutHistoryScreen id={id} {...(current !== undefined && { current })} />
    </HangDataProvider>
  );
}
