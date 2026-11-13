import type { Plan } from "@sendtally/api-client";
import { blockEnded, type Block, type CalendarDate, type DatedBlock } from "@sendtally/core/hang";
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

/** The most weeks a block can run. */
export const MAX_BLOCK_WEEKS = 16;

/** How many weeks New block starts with. */
const DEFAULT_BLOCK_WEEKS = 4;

/** New block: an untitled template of the usual length. */
export const newBlock = (id: string): Block => ({
  id,
  name: "",
  start: null,
  weeks: DEFAULT_BLOCK_WEEKS,
  focus: null,
});

/** A length stepped or typed, kept between the weeks it has run and the most a block can run. */
export const clampWeeks = (n: number, minWeeks = 1): number =>
  Math.min(MAX_BLOCK_WEEKS, Math.max(minWeeks, n));

/** Whether a block's length can step that way. */
export const canStepWeeks = (block: Pick<Block, "weeks">, by: number, minWeeks = 1): boolean =>
  by < 0 ? block.weeks > minWeeks : block.weeks < MAX_BLOCK_WEEKS;

/** A typed name, except that a scheduled block keeps a name: an emptied one goes back to what it was. */
export const keptName = (typed: string, block: Pick<Block, "start">, savedName: string): string =>
  typed === "" && block.start !== null ? savedName : typed;

/** The blocks a workout can be added to, any not over yet, each saying whether it already holds it. */
export const addToBlockOptions = (
  plan: Pick<Plan, "blocks" | "memberships">,
  workoutId: string,
  today: CalendarDate
): { block: Block; there: boolean }[] =>
  plan.blocks
    .filter((b) => !blockEnded(b, today))
    .map((block) => ({
      block,
      there: plan.memberships.some((m) => m.blockId === block.id && m.workoutId === workoutId),
    }));
