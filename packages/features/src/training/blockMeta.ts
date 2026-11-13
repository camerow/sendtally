import type { Block, CalendarDate, DatedBlock } from "@sendtally/core/hang";
import { t } from "../i18n";
import { blockMembers } from "./blocks";
import type { TrainingLog } from "./days";
import { blockDone } from "./recap";

const weeks = (n: number): string => t("calendar.weeks", { count: n });

/** A template's line: its weeks and how many workouts it holds. */
export const templateMeta = (log: TrainingLog, b: Block): string =>
  `${weeks(b.weeks)} · ${t("plan.workoutCount", { count: blockMembers(log.plan, b).length })}`;

/** A past block's line: its weeks and how much of it was done. */
export function pastMeta(log: TrainingLog, b: DatedBlock, today: CalendarDate): string {
  const done = blockDone(log, b, today);
  return [weeks(b.weeks), ...(done.planned > 0 ? [t("plan.doneOf", done)] : [])].join(" · ");
}
