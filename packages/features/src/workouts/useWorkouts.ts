import type { SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The user's own workouts of every kind, oldest first. */
export function useWorkouts(api: SendtallyApi): Query<WorkoutRecord[]> {
  return useQuery(queries.workouts(api));
}
