import {
  addDays,
  addMonths,
  blockWeekOn,
  monthStart,
  weekStart,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";
import { t } from "../i18n";

/** A block over one week row: which block, and which of its weeks the row is. */
export type Band = { block: Block; week: number };

/** The Mondays of every week row a month touches. */
export function monthWeeks(month: CalendarDate): CalendarDate[] {
  const next = addMonths(month, 1);
  const mondays: CalendarDate[] = [];
  for (let d = weekStart(monthStart(month)); d < next; d = addDays(d, 7)) mondays.push(d);
  return mondays;
}

/** The block running over any day of the week from `monday`, and its week number there. */
export function bandOn(blocks: readonly Block[], monday: CalendarDate): Band | null {
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const block = blocks.find((b) => blockWeekOn(b, day) !== null);
    if (block !== undefined) return { block, week: blockWeekOn(block, day) ?? 1 };
  }
  return null;
}

/** The block a day falls in, if any. */
export const blockOn = (blocks: readonly Block[], date: CalendarDate): Block | null =>
  blocks.find((b) => blockWeekOn(b, date) !== null) ?? null;

/** The band over a calendar week naming the block it is in: "Name · wk n of N", or null. */
export function bandText(blocks: readonly Block[], monday: CalendarDate): string | null {
  const band = bandOn(blocks, monday);
  return band === null
    ? null
    : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks });
}

/** A month grid day: off outside the bounds, on when picked (the selected day if none are listed). */
export function calendarDay(
  d: CalendarDate,
  {
    selected,
    picked,
    min,
    max,
  }: {
    selected: CalendarDate;
    picked?: readonly CalendarDate[] | undefined;
    min: CalendarDate | null;
    max?: CalendarDate | undefined;
  }
): { off: boolean; on: boolean } {
  return {
    off: (min !== null && d < min) || (max !== undefined && d > max),
    on: picked === undefined ? d === selected : picked.includes(d),
  };
}
