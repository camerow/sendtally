import type { Plan } from "@sendtally/api-client";
import {
  usePlanDraft as useSharedPlanDraft,
  type PlanDraftState,
} from "@sendtally/features/training";
import { usePlanActions } from "../plan/usePlanActions";

export type { PlanDraftState };

/** The shared Edit mode draft, saved through mobile's plan writes. */
export function usePlanDraft(plan: Plan, startEditing = false): PlanDraftState {
  return useSharedPlanDraft(plan, usePlanActions(), startEditing);
}
