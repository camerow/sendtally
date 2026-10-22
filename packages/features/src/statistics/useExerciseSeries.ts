import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useActivities } from "../activities/useActivities";
import type { QueryState } from "../query";
import { exerciseSeries, type ExerciseSeries } from "./exercises";

/** Every logged exercise as a session series, the most often logged first. */
export function useExerciseSeries(api: SendtallyApi): QueryState<ExerciseSeries[]> {
  const { state } = useActivities(api);
  return React.useMemo(
    (): QueryState<ExerciseSeries[]> =>
      state.status !== "ready" ? state : { status: "ready", data: exerciseSeries(state.data) },
    [state]
  );
}
