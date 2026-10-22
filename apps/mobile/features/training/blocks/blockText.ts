import {
  addDays,
  blockEnd,
  blockWeekOn,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

/** "28 Sep to 25 Oct": first and last day, both inclusive. */
export function blockDates(block: Pick<Block, "start" | "weeks">): string {
  return t("plan.blockDates", {
    start: shortDate(block.start),
    last: shortDate(addDays(blockEnd(block), -1)),
  });
}

/** "Training block · week 2 of 4" while it runs, when it starts before then. */
export function blockKicker(block: Block, today: CalendarDate): string {
  const at = blockWeekOn(block, today);
  if (at === null) return t("plan.blockStarts", { date: shortDate(block.start) });
  return t("plan.blockWeekOf", { at, of: block.weeks });
}

/** "Hangboard · week 3 of 5" for a plan in a block on `date`; null outside one. */
export function blockTag(label: string, block: Block, date: CalendarDate): string | null {
  const at = blockWeekOn(block, date);
  return at === null ? null : t("hang.blockWeek", { label, at, of: block.weeks });
}
