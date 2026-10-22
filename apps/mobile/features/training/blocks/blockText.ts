import type { BlockPhase, TrainingBlock } from "@sendtally/api-client";
import { addDays, blockEnd, blockWeekOn, phaseOn, type CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export function phaseLabel(phase: BlockPhase): string {
  switch (phase) {
    case "build":
      return t("plan.phaseBuild");
    case "deload":
      return t("plan.phaseDeload");
    case "test":
      return t("plan.phaseTest");
  }
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

/** "Hangboard · week 2 of 4 · Deload" for a plan in a block on `date`, null outside one. */
export function blockTag(label: string, block: TrainingBlock, date: CalendarDate): string | null {
  const at = blockWeekOn(block, date);
  const phase = phaseOn(block, date);
  if (at === null || phase === null) return null;
  const week = t("hang.blockWeek", { label, at, of: block.weeks });
  return phase === "build" ? week : t("plan.withPhase", { label: week, phase: phaseLabel(phase) });
}
