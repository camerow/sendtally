import type { SendtallyApi, UserWorkout } from "@sendtally/api-client";
import { queries, useQuery, type Query } from "../query";

/** The user's own workouts other than hangboard ones, oldest first. */
export function useWorkouts(api: SendtallyApi): Query<UserWorkout[]> {
  return useQuery(queries.workouts(api));
}
