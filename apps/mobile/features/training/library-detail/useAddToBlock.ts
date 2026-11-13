import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { isDated } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  nextPosition,
  useTrainingLog,
  blockDateRange,
  blockName,
  addToBlockOptions,
} from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useAddToMenu, type AddToMenu } from "../components/useAddToMenu";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { blockMembership } from "@sendtally/features/training";

/** A workout's Add to block: any template or block not over yet, with no days to start. */
export function useAddToBlock(workout: LibraryWorkout): AddToMenu {
  const { today } = useHangData();
  const { plan } = useTrainingLog(useApi()).log;
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const options = addToBlockOptions(plan, workout.id, today);
  return useAddToMenu({
    title: t("plan.addToBlockMenu"),
    name: workout.name,
    options: options.map(({ block: b, there }) => ({
      id: b.id,
      label: blockName(b),
      detail: isDated(b) ? blockDateRange(b) : t("plan.template"),
      there,
    })),
    add: (id) => {
      const block = options.find((o) => o.block.id === id)?.block;
      if (block === undefined) return;
      void actions.saveMembership(
        blockMembership(randomUUID(), workout.id, block, today, nextPosition(plan, block.id))
      );
      prompt();
    },
    view: (id) => router.push({ pathname: "/plan/block/[id]", params: { id } }),
  });
}
