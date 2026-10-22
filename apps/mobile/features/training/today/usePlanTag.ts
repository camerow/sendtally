import { blockWeeks, weekOfBlock, type CalendarDate, type Schedule } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockTag } from "../blocks/blockText";
import { useBlocks } from "../blocks/useBlocks";

type Tagged = Pick<Schedule, "start" | "end" | "blockId">;

/**
 * "Hangboard · week 1 of 4" for a plan with an end, with its block week's phase and load
 * when they are set; just the label for an ongoing one.
 */
export function usePlanTag(): (label: string, plan: Tagged, date: CalendarDate) => string {
  const blocks = useBlocks();
  return (label, plan, date) => {
    const block = blocks.find((b) => b.id === plan.blockId);
    const inBlock = block === undefined ? null : blockTag(label, block, date);
    if (inBlock !== null) return inBlock;
    const of = blockWeeks(plan);
    return of === null ? label : t("hang.blockWeek", { label, at: weekOfBlock(plan, date), of });
  };
}
