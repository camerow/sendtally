import type { Plan } from "@sendtally/api-client";
import { usePlanDraft as useSharedDraft, type PlanDraftState } from "@sendtally/features/training";
import { usePlanActions } from "../plan/usePlanActions";

export type { PlanDraftState };

/** The shared plan draft, saved with mobile's plan writes. */
export function usePlanDraft(plan: Plan, startEditing = false): PlanDraftState {
  return useSharedDraft(plan, usePlanActions(), startEditing);
}
