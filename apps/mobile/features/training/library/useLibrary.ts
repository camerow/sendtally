import { useWorkoutLibrary, type WorkoutLibraryQuery } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";

/** The one workout library, built in and the user's own, of every kind. */
export function useLibrary(): WorkoutLibraryQuery {
  return useWorkoutLibrary(useApi());
}
