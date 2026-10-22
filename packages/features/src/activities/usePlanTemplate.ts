import type { PlanTemplate, SendtallyApi } from "@sendtally/api-client";
import { usePlanItems } from "./useActivities";

/** The template of the plan item an activity fulfils: undefined while the plan is loading. */
export function usePlanTemplate(
  api: SendtallyApi,
  planItemId: string | null
): PlanTemplate | null | undefined {
  const { state } = usePlanItems(api);
  if (planItemId === null) return null;
  if (state.status === "loading") return undefined;
  if (state.status === "error") return null;
  return state.data.find((p) => p.id === planItemId)?.template ?? null;
}
