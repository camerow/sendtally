import {
  isCalendarDate,
  WORKOUT_KINDS,
  type Block,
  type CalendarDate,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

/** Where an add started: a day to schedule on, a block to add to. */
export type AddFlow = { date: CalendarDate | null; blockId: string | null };

export type RawAddParams = { date?: string; blockId?: string; kind?: string };

/** The add flow a route was opened with, ignoring what is not a real date. */
export function addFlowOf(p: RawAddParams): AddFlow {
  return {
    date: p.date !== undefined && isCalendarDate(p.date) ? p.date : null,
    blockId: p.blockId === undefined || p.blockId === "" ? null : p.blockId,
  };
}

/** The add flow as route params, leaving out what it has not got. */
export function addFlowParams(flow: AddFlow): RawAddParams {
  return {
    ...(flow.date === null ? {} : { date: flow.date }),
    ...(flow.blockId === null ? {} : { blockId: flow.blockId }),
  };
}

/** The kind picked before the add screen opened, if one was. */
export const addKindOf = (p: RawAddParams): WorkoutKind | null =>
  WORKOUT_KINDS.find((k) => k === p.kind) ?? null;

/** What the add is for: the block, the day, or the plan. */
export function addKicker(flow: AddFlow, blocks: readonly Block[]): string {
  const block = flow.blockId === null ? undefined : blocks.find((b) => b.id === flow.blockId);
  return block !== undefined
    ? t("plan.addToBlock", { name: block.name })
    : flow.date !== null
      ? t("plan.forDate", { date: shortDate(flow.date) })
      : t("plan.addToPlan");
}
