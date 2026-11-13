import {
  blockLastDay,
  blockWeekOn,
  type Block,
  type CalendarDate,
  type DatedBlock,
} from "@sendtally/core/hang";
import { shortDate } from "../hang/format";
import { formatNumber, t } from "../i18n";
import { blockGroups } from "./blocks";
import type { TrainingLog } from "./days";
import { blockDone, type DoneCount } from "./recap";

/** A block's name, or Untitled for a template not named yet. */
export const blockName = (block: Pick<Block, "name">): string => block.name || t("plan.untitled");

/** "28 Sep to 25 Oct": first and last day, both inclusive. */
export const blockDateRange = (block: Pick<DatedBlock, "start" | "weeks">): string =>
  t("plan.blockDates", { start: shortDate(block.start), last: shortDate(blockLastDay(block)) });

/** "Training block · week 2 of 4" while it runs, when it starts before then; a template says so. */
export function blockKicker(block: Block, today: CalendarDate): string {
  if (block.start === null) return t("plan.template");
  const at = blockWeekOn(block, today);
  if (at === null) return t("plan.blockStarts", { date: shortDate(block.start) });
  return t("plan.blockWeekOf", { at, of: block.weeks });
}

/** "Hangboard · week 3 of 5" for a plan in a block on `date`; null outside one. */
export function blockTag(label: string, block: Block, date: CalendarDate): string | null {
  const at = blockWeekOn(block, date);
  return at === null ? null : t("hang.blockWeek", { label, at, of: block.weeks });
}

/** "3 of 5". */
export const doneOfShort = (c: DoneCount): string =>
  t("plan.doneOfShort", { done: formatNumber(c.done), planned: formatNumber(c.planned) });

/** An average effort to one place, or "-" with none. */
export const effortText = (effort: number | null): string =>
  effort === null ? "-" : formatNumber(Math.round(effort * 10) / 10);

/** The block running today and "Week 2 of 4 · 3 of 8 done"; null outside a block. */
export function currentBlockLine(
  log: TrainingLog,
  today: CalendarDate
): { block: DatedBlock; meta: string } | null {
  const block = blockGroups(log.plan.blocks, today).current[0];
  if (block === undefined) return null;
  const done = blockDone(log, block, today);
  const meta = [
    t("plan.blockWeek", { at: blockWeekOn(block, today) ?? 1, of: block.weeks }),
    ...(done.planned > 0 ? [t("plan.doneOf", done)] : []),
  ].join(" · ");
  return { block, meta };
}
