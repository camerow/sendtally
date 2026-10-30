import {
  useWorkoutLibrary,
  type LibraryWorkout,
  type WorkoutLibraryQuery,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";

/** The one workout library, built in and the user's own, of every kind. */
export function useLibrary(): WorkoutLibraryQuery {
  return useWorkoutLibrary(useApi());
}

/** The library workout a run plays, once the library has loaded. */
export function useRunWorkout(id: string | null): LibraryWorkout | undefined {
  const { state } = useLibrary();
  return state.status === "ready" && id !== null ? state.data.workout(id) : undefined;
}

/** How many sessions of the workout are logged, which is the turn its next session takes. */
export function useNextSession(id: string): number {
  const { state } = useLibrary();
  return state.status === "ready" ? (state.data.usage.get(id)?.count ?? 0) : 0;
}
