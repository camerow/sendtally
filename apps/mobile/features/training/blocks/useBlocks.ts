import type { TrainingBlock } from "@sendtally/api-client";
import { useTrainingBlocks } from "@sendtally/features/activities";
import { useApi } from "../../../lib/api";

/** The user's training blocks, or none while they load. */
export function useBlocks(): TrainingBlock[] {
  const { state } = useTrainingBlocks(useApi());
  return state.status === "ready" ? state.data : [];
}
