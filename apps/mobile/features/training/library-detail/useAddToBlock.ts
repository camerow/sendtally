import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { blockEnded, isDated } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { nextPosition, useTrainingLog } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { blockDateRange } from "../blocks/blockText";
import { useAddToMenu, type AddToMenu } from "../components/useAddToMenu";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { blockMembership } from "../planning/useAddTo";

/** A workout's Add to block: any template or block not over yet, with no days to start. */
export function useAddToBlock(workout: LibraryWorkout): AddToMenu {
  const { today } = useHangData();
  const { plan } = useTrainingLog(useApi()).log;
  const actions = usePlanActions();
  const blocks = plan.blocks.filter((b) => !blockEnded(b, today));
  return useAddToMenu({
    title: t("plan.addToBlockMenu"),
    name: workout.name,
    options: blocks.map((b) => ({
      id: b.id,
      label: b.name || t("plan.untitled"),
      detail: isDated(b) ? blockDateRange(b) : t("plan.template"),
      there: plan.memberships.some((m) => m.blockId === b.id && m.workoutId === workout.id),
    })),
    add: (id) => {
      const block = blocks.find((b) => b.id === id);
      if (block !== undefined)
        void actions.saveMembership(
          blockMembership(randomUUID(), workout.id, block, today, nextPosition(plan, block.id))
        );
    },
    view: (id) => router.push({ pathname: "/plan/block/[id]", params: { id } }),
  });
}
