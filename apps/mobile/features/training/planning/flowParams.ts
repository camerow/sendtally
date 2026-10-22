import { isCalendarDate, type CalendarDate } from "@sendtally/core/hang";

/** Where an add started: a day to schedule on, a block to add to. */
export type AddFlow = { date: CalendarDate | null; blockId: string | null };

export type RawAddParams = { date?: string; blockId?: string };

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
