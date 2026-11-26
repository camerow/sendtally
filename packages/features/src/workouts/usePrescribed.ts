import { prescription, sessionItems, type PlanLink, type SessionItem } from "@sendtally/core/hang";
import type { SendtallyApi } from "@sendtally/api-client";
import { usePlan } from "../training/usePlan";
import { useWorkoutLibrary } from "./useWorkoutLibrary";

/**
 * What a run of a workout asks for: the doses its session takes, with a plan that week's
 * prescription. Undefined while it loads; empty without a workout.
 */
export function usePrescribed(
  api: SendtallyApi,
  workoutId: string | null,
  link: PlanLink,
  session: number
): SessionItem[] | undefined {
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

/**
 * What a logged workout asked for, for its targets when it is edited: its workout's doses when
 * every item has one, since the log does not keep which turn of an alternating workout it ran.
 */
export function useLoggedPrescription(
  api: SendtallyApi,
  logged: { workoutId: string | null; membershipId: string | null; week: number | null }
): SessionItem[] {
  const library = useWorkoutLibrary(api).state;
  const workout =
    logged.workoutId === null || library.status !== "ready"
      ? undefined
      : library.data.workout(logged.workoutId);
  const items = usePrescribed(
    api,
    logged.workoutId,
    { membershipId: logged.membershipId, week: logged.week, focus: null },
    0
  );
  // ponytail: an alternating workout's edit shows no targets because the log keeps no turn; store the variant that ran on the activity to show them.
  return workout?.items.every((i) => i.doses.length <= 1) === true ? (items ?? []) : [];
}
