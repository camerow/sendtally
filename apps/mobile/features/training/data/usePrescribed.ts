import { prescription, type Item, type PlanLink } from "@sendtally/core/hang";
import { usePlan } from "@sendtally/features/training";
import { useWorkoutLibrary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";

/**
 * What a run of a workout asks for: its variation as written, or with a plan that
 * week's prescription. Undefined while it loads; empty without a workout.
 */
export function usePrescribed(workoutId: string | null, link: PlanLink): Item[] | undefined {
  const api = useApi();
  const library = useWorkoutLibrary(api).state;
  const plan = usePlan(api).state;
  if (workoutId === null) return [];
  if (library.status === "loading") return undefined;
  const workout = library.status === "ready" ? library.data.workout(workoutId) : undefined;
  if (workout === undefined) return [];
  const variation = link.variation ?? 0;
  if (link.membershipId === null) return workout.variations[variation]?.items ?? [];
  if (plan.status === "loading") return undefined;
  const changes = plan.status === "ready" ? plan.data.weekChanges : [];
  return prescription(changes, {
    workout,
    membershipId: link.membershipId,
    variation,
    week: link.week,
  });
}
