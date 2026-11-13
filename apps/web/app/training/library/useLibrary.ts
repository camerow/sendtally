import { useWorkoutLibrary, type WorkoutLibraryQuery } from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";

/** The one workout library, built in and the user's own, of every kind. */
export function useLibrary(): WorkoutLibraryQuery {
  return useWorkoutLibrary(useAppApi());
}

export const workoutPath = (id: string): string => `/app/train/workouts/${encodeURIComponent(id)}`;
