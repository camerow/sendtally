import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The user's exercises, by name. */
export function useExercises(api: SendtallyApi): Query<Exercise[]> {
  return useQuery(queries.exercises(api));
}

const NONE: Exercise[] = [];

/** The user's exercises once loaded, none before. */
export function useExerciseList(api: SendtallyApi): Exercise[] {
  const state = useExercises(api).state;
  return state.status === "ready" ? state.data : NONE;
}
