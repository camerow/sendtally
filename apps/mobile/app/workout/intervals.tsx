import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { IntervalsScreen } from "../../features/training/intervals/IntervalsScreen";
import { readIntervalsParams } from "../../features/training/intervals/intervalsParams";

export default function IntervalsRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  const workout = readIntervalsParams(params);
  return workout === null ? (
    <Redirect href="/" />
  ) : (
    <IntervalsScreen workout={workout} end={params.end === "1"} />
  );
}
