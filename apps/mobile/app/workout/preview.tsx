import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { addFlowOf, type RawAddParams } from "../../features/training/planning/flowParams";
import { WorkoutPreviewScreen } from "../../features/training/planning/WorkoutPreviewScreen";

export default function WorkoutPreviewRoute(): React.ReactElement {
  const { id, add, ...params } = useLocalSearchParams<
    RawAddParams & { id: string; add?: string }
  >();
  return (
    <HangDataProvider>
      <WorkoutPreviewScreen id={id} adding={add === undefined ? null : addFlowOf(params)} />
    </HangDataProvider>
  );
}
