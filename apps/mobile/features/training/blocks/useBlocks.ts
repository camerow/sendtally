import type { Block } from "@sendtally/core/hang";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";

/** The user's training blocks, or none while they load. */
export function useBlocks(): Block[] {
  const { state } = usePlan(useApi());
  return state.status === "ready" ? state.data.blocks : [];
}
