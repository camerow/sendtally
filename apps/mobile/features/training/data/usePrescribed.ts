import { prescription, sessionItems, type PlanLink, type SessionItem } from "@sendtally/core/hang";
import { usePlan } from "@sendtally/features/training";
import { useWorkoutLibrary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";

/**
 * What a run of a workout asks for: the doses its session takes, with a plan that week's
 * prescription. Undefined while it loads; empty without a workout.
 */
export function usePrescribed(
  workoutId: string | null,
  link: PlanLink,
  session: number
): SessionItem[] | undefined {
  const api = useApi();
  const library = useWorkoutLibrary(api).state;
  const plan = usePlan(api).state;
  if (workoutId === null) return [];
  if (library.status === "loading") return undefined;
  const workout = library.status === "ready" ? library.data.workout(workoutId) : undefined;
  if (workout === undefined) return [];
  if (link.membershipId === null) return sessionItems(workout.items, session);
  if (plan.status === "loading") return undefined;
  const changes = plan.status === "ready" ? plan.data.weekChanges : [];
  return prescription(changes, {
    workout,
    membershipId: link.membershipId,
    session,
    week: link.week,
  });
}
