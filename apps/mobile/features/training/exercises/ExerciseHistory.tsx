import { router } from "expo-router";
import React from "react";
import type { WeightUnit } from "@sendtally/core/hang";
import { useActivities } from "@sendtally/features/activities";
import type { ExerciseSeries } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { HistoryList } from "../history/HistoryList";
import { exerciseItems } from "../history/historyItems";

export type ExerciseHistoryProps = { series: ExerciseSeries; unit: WeightUnit };

/** An exercise's sessions with their best set, each opening its workout's summary. */
export function ExerciseHistory({ series, unit }: ExerciseHistoryProps): React.ReactElement | null {
  const activities = useActivities(useApi()).state;
  return (
    <HistoryList
      items={exerciseItems(series, activities.status === "ready" ? activities.data : [], unit)}
      onOpen={(id) => router.push({ pathname: "/activity/[id]", params: { id } })}
    />
  );
}
