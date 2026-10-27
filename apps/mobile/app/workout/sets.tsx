import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { readWorkoutRun } from "../../features/training/data/workoutRunParams";
import { SetsScreen } from "../../features/training/sets/SetsScreen";

export default function SetsRoute(): React.ReactElement {
  const run = readWorkoutRun(useLocalSearchParams());
  return run === null ? <Redirect href="/" /> : <SetsScreen run={run} />;
}
