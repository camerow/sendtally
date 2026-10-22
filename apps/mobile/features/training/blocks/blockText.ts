import type { BlockPhase, TrainingBlock, WeekLoad } from "@sendtally/api-client";
import {
  addDays,
  BASE_WEEK_LOAD,
  blockEnd,
  blockWeekOn,
  weekLoadOn,
  phaseOn,
  type CalendarDate,
} from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export function phaseLabel(phase: BlockPhase): string {
  switch (phase) {
    case "load":
      return t("plan.phaseLoad");
    case "deload":
      return t("plan.phaseDeload");
    case "test":
      return t("plan.phaseTest");
    case "perform":
      return t("plan.phasePerform");
  }
}

/** "Week 3, 110% load · Test" */
export function loadWeekLabel(n: number, week: WeekLoad): string {
  const label = t("plan.loadWeek", { n, load: week.load });
  return week.phase === undefined
    ? label
    : t("plan.withPhase", { label, phase: phaseLabel(week.phase) });
}

/** "28 Sep to 25 Oct": first and last day, both inclusive. */
export function blockDates(block: Pick<TrainingBlock, "start" | "weeks" | "endedOn">): string {
  return t("plan.blockDates", {
    start: shortDate(block.start),
    last: shortDate(addDays(blockEnd(block), -1)),
  });
}

/** "Training block · week 2 of 4" while it runs, when it starts before then. */
export function blockKicker(block: TrainingBlock, today: CalendarDate): string {
  const at = blockWeekOn(block, today);
  if (at === null) return t("plan.blockStarts", { date: shortDate(block.start) });
  return t("plan.blockWeekOf", { at, of: block.weeks });
}

/**
 * "Hangboard · week 3 of 5 · Test · 110% load" for a plan in a block on `date`, with the
 * week's phase when it has one and its load when that is not the base; null outside one.
 */
export function blockTag(label: string, block: TrainingBlock, date: CalendarDate): string | null {
  const at = blockWeekOn(block, date);
  const load = weekLoadOn(block, date);
  if (at === null || load === null) return null;
  const phase = phaseOn(block, date);
  const week = t("hang.blockWeek", { label, at, of: block.weeks });
  const tagged =
    phase === null ? week : t("plan.withPhase", { label: week, phase: phaseLabel(phase) });
  return load === BASE_WEEK_LOAD ? tagged : t("plan.withLoad", { label: tagged, load });
}
