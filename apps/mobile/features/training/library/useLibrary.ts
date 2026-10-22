import { useWorkoutLibrary, type WorkoutLibraryQuery } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";

/** The one workout library, built in and the user's own, of every category. */
export function useLibrary(): WorkoutLibraryQuery {
  return useWorkoutLibrary(useApi(), useHangData().model);
}
