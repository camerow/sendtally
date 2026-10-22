import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { AddPlanScreen } from "../../features/training/planning/AddPlanScreen";
import { addFlowOf, type RawAddParams } from "../../features/training/planning/flowParams";

export default function AddPlanRoute(): React.ReactElement {
  const params = useLocalSearchParams<RawAddParams>();
  return (
    <HangDataProvider>
      <AddPlanScreen flow={addFlowOf(params)} />
    </HangDataProvider>
  );
}
