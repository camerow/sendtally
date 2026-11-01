import { isCalendarDate, type Block, type CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

/** Where an add started: a day to schedule on, a block to add to, from its editor or not. */
export type AddFlow = { date: CalendarDate | null; blockId: string | null; editing?: boolean };

export type RawAddParams = { date?: string; blockId?: string; editing?: string };

/** The add flow a route was opened with, ignoring what is not a real date. */
export function addFlowOf(p: RawAddParams): AddFlow {
  return {
    date: p.date !== undefined && isCalendarDate(p.date) ? p.date : null,
    blockId: p.blockId === undefined || p.blockId === "" ? null : p.blockId,
    ...(p.editing === "1" && { editing: true }),
  };
}

/** The add flow as route params, leaving out what it has not got. */
export function addFlowParams(flow: AddFlow): RawAddParams {
  return {
    ...(flow.date === null ? {} : { date: flow.date }),
    ...(flow.blockId === null ? {} : { blockId: flow.blockId }),
    ...(flow.editing === true && { editing: "1" }),
  };
}

/** Where the add goes, the sheet's title saying what it does: the day, or the block. */
export function addKicker(flow: AddFlow, blocks: readonly Block[]): string {
  const block = flow.blockId === null ? undefined : blocks.find((b) => b.id === flow.blockId);
  return flow.date !== null
    ? shortDate(flow.date)
    : block !== undefined
      ? block.name || t("plan.untitled")
      : t("plan.addToPlan");
}
