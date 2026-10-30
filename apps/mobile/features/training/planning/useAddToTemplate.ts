import { randomUUID } from "expo-crypto";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { backToPlan } from "./backToPlan";
import type { AddFlow } from "./flowParams";

/**
 * Adding to a template skips the days step: the workout goes in with none, to be tapped
 * in on the block's grid. Null when the add is for anywhere else, which asks when.
 */
export function useAddToTemplate(flow: AddFlow | null): ((workoutId: string) => void) | null {
  const { today } = useHangData();
  const plan = usePlan(useApi()).state;
  const actions = usePlanActions();
  const block =
    plan.status === "ready" && flow?.blockId != null
      ? plan.data.blocks.find((b) => b.id === flow.blockId)
      : undefined;
  if (block === undefined || block.start !== null) return null;
  return (workoutId) => {
    const id = randomUUID();
    void actions.saveMembership({ id, workoutId, blockId: block.id, weekdays: [], start: today });
    backToPlan(block.id, today, id, flow?.editing === true);
  };
}
