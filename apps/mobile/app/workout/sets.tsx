import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { OwnerKnown } from "../../features/live-session/OwnerKnown";
import { readWorkoutRun } from "@sendtally/features/workouts";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { SetsScreen } from "../../features/training/sets/SetsScreen";

export default function SetsRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const run = readWorkoutRun(params);
  return run === null ? (
    <Redirect href="/" />
  ) : (
    <OwnerKnown>
      <HangDataProvider>
        <SetsScreen run={run} end={params.end === "1"} />
      </HangDataProvider>
    </OwnerKnown>
  );
}
