import type { PlanTemplate, SendtallyApi } from "@sendtally/api-client";
import { libraryOf, planTemplateOf } from "../workouts/library";
import { useWorkouts } from "../workouts/useWorkouts";
import { usePlanItems } from "./useActivities";

/**
 * The body of the plan item an activity fulfils, its workout's when it runs one:
 * undefined while that is loading.
 */
export function usePlanTemplate(
  api: SendtallyApi,
  planItemId: string | null
): PlanTemplate | null | undefined {
  const { state } = usePlanItems(api);
  const { state: workouts } = useWorkouts(api);
  if (planItemId === null) return null;
  if (state.status === "loading") return undefined;
  if (state.status === "error") return null;
  const item = state.data.find((p) => p.id === planItemId);
  if (item === undefined) return null;
  if (item.workoutId === null || item.workoutId === undefined) return item.template;
  if (workouts.status === "loading") return undefined;
  return planTemplateOf(item, libraryOf([], workouts.status === "ready" ? workouts.data : []));
}
