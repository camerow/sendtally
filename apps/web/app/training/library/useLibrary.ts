import {
  useWorkoutLibrary,
  type LibraryWorkout,
  type WorkoutLibraryQuery,
} from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";

/** The one workout library, built in and the user's own, of every kind. */
export function useLibrary(): WorkoutLibraryQuery {
  return useWorkoutLibrary(useAppApi());
}

/** Looks a workout up in the library by id; none until the library loads, or for a missing one. */
export const workoutIn =
  ({ state }: WorkoutLibraryQuery) =>
  (id: string | null): LibraryWorkout | undefined =>
    state.status === "ready" && id !== null ? state.data.workout(id) : undefined;

export const WORKOUTS_VIEW = "/app/train?view=workouts";

export const workoutPath = (id: string): string => `/app/train/workouts/${encodeURIComponent(id)}`;
