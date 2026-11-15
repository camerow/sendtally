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
import { useApi } from "../../../lib/api";
import { useAddToMenu, type AddToMenu } from "../components/useAddToMenu";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { blockMembership } from "@sendtally/features/training";

/**
 * Add to block for a workout, or for what becomes one once picked: any template or block not
 * over yet, with no days to start. `workoutId` is the workout when there is one already;
 * without, `resolve` makes it on a pick.
 */
export function useAddToBlock(
  name: string,
  workoutId: string | undefined,
  resolve: () => Promise<string | null> = async () => null
): AddToMenu {
  const { today } = useHangData();
  const { plan } = useTrainingLog(useApi()).log;
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const options = addToBlockOptions(plan, workoutId ?? "", today);
  return useAddToMenu({
    title: t("plan.addToBlockMenu"),
    name,
    options: options.map(({ block: b, there }) => ({
      id: b.id,
      label: blockName(b),
      detail: isDated(b) ? blockDateRange(b) : t("plan.template"),
      there,
    })),
    add: (id) => {
      const block = options.find((o) => o.block.id === id)?.block;
      if (block === undefined) return;
      const save = (id: string | null): void => {
        if (id === null) return;
        void actions.saveMembership(
          blockMembership(randomUUID(), id, block, today, nextPosition(plan, block.id))
        );
        prompt();
      };
      if (workoutId !== undefined) save(workoutId);
      else void resolve().then(save);
    },
    view: (id) => router.push({ pathname: "/plan/block/[id]", params: { id } }),
  });
}
