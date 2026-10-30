import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { ChecklistScreen } from "../../features/training/checklist/ChecklistScreen";
import { readWorkoutRun } from "../../features/training/data/workoutRunParams";

export default function ChecklistRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const run = readWorkoutRun(params);
  return run === null ? (
    <Redirect href="/" />
  ) : (
    <ChecklistScreen run={run} end={params.end === "1"} />
  );
}
