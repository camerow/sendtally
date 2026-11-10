import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { ExerciseProgress } from "@sendtally/core/hang";
import { useActivities } from "../activities/useActivities";
import { useGradeScalePrefs } from "../settings/useGradeScales";
import { useExercises } from "./useExercises";
import type { QueryState } from "../query";
import { exerciseKey, exerciseSeries, type ExerciseSeries } from "./exercises";

/** Every logged exercise as a session series, the most often logged first, each on its progress. */
export function useExerciseSeries(api: SendtallyApi): QueryState<ExerciseSeries[]> {
  const { state } = useActivities(api);
  const exercises = useExercises(api).state;
  const { scales } = useGradeScalePrefs(api);
  return React.useMemo((): QueryState<ExerciseSeries[]> => {
    if (state.status !== "ready") return state;
    const mine = exercises.status === "ready" ? exercises.data : [];
    const progressOf = (key: string): ExerciseProgress | null | undefined =>
      mine.find((e) => exerciseKey(e.name) === key)?.progress;
    return { status: "ready", data: exerciseSeries(state.data, progressOf, scales) };
  }, [state, exercises, scales]);
}
