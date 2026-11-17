import type { Exercise, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The user's exercises, by name. */
export function useExercises(api: SendtallyApi): Query<Exercise[]> {
  return useQuery(queries.exercises(api));
}
