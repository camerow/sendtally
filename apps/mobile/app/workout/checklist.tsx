import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { OwnerKnown } from "../../features/live-session/OwnerKnown";
import { ChecklistScreen } from "../../features/training/checklist/ChecklistScreen";
import { readWorkoutRun } from "@sendtally/features/workouts";

export default function ChecklistRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const run = readWorkoutRun(params);
  return run === null ? (
    <Redirect href="/" />
  ) : (
    <OwnerKnown>
      <ChecklistScreen run={run} end={params.end === "1"} />
    </OwnerKnown>
  );
}
