import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { OwnerKnown } from "../../features/live-session/OwnerKnown";
import { IntervalsScreen } from "../../features/training/intervals/IntervalsScreen";
import { readIntervalsParams } from "@sendtally/features/workouts";

export default function IntervalsRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const workout = readIntervalsParams(params);
  return workout === null ? (
    <Redirect href="/" />
  ) : (
    <OwnerKnown>
      <IntervalsScreen workout={workout} end={params.end === "1"} />
    </OwnerKnown>
  );
}
