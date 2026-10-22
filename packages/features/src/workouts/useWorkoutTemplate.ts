import type { PlanTemplate, SendtallyApi } from "@sendtally/api-client";
import { libraryOf, templateOfWorkout } from "./library";
import { useWorkouts } from "./useWorkouts";

/** The sets, checklist or intervals of a workout to log: undefined while the user's own are loading. */
export function useWorkoutTemplate(
  api: SendtallyApi,
  workoutId: string | null
): PlanTemplate | null | undefined {
  const { state } = useWorkouts(api);
  if (workoutId === null) return null;
  if (state.status === "loading") return undefined;
  const mine = state.status === "ready" ? state.data : [];
  return templateOfWorkout(libraryOf([], mine).find((w) => w.id === workoutId));
}
