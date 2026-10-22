import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { addFlowOf, type RawAddParams } from "../../features/training/planning/flowParams";
import { ScheduleScreen } from "../../features/training/planning/ScheduleScreen";

export default function ScheduleRoute(): React.ReactElement {
  const { workoutId, ...params } = useLocalSearchParams<RawAddParams & { workoutId: string }>();
  return (
    <HangDataProvider>
      <ScheduleScreen workoutId={workoutId} flow={addFlowOf(params)} />
    </HangDataProvider>
  );
}
