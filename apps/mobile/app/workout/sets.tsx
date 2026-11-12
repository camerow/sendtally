import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { readWorkoutRun } from "@sendtally/features/workouts";
import { SetsScreen } from "../../features/training/sets/SetsScreen";

export default function SetsRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const run = readWorkoutRun(params);
  return run === null ? <Redirect href="/" /> : <SetsScreen run={run} end={params.end === "1"} />;
}
