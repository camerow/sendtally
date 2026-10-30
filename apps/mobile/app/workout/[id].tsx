import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutScreen } from "../../features/training/library-detail/WorkoutScreen";
import { addFlowOf, type RawAddParams } from "../../features/training/planning/flowParams";

export default function WorkoutRoute(): React.ReactElement {
  const { id, grip, add, ...params } = useLocalSearchParams<
    RawAddParams & { id: string; grip?: string; add?: string }
  >();
  return (
    <HangDataProvider framed>
      <WorkoutScreen id={id} grip={grip} adding={add === undefined ? null : addFlowOf(params)} />
    </HangDataProvider>
  );
}
