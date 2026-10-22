import {
  addDays,
  addMonths,
  blockWeekOn,
  daysBetween,
  monthStart,
  weekStart,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";

/** Whole Monday to Sunday weeks, as a block holds them. */
export type WeekSpan = { start: CalendarDate; weeks: number };

/** The weeks being picked for a new block: the first tap, then the last. */
export type WeekPick = { first: CalendarDate; last: CalendarDate | null } | null;

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

/** A tap while picking: the first week, then the last; a third tap starts over. */
export function pickWeek(pick: WeekPick, date: CalendarDate): WeekPick {
  return pick === null || pick.last !== null
    ? { first: date, last: null }
    : { ...pick, last: date };
}

/** The whole weeks between two tapped days, in either order. */
export function spanOf(pick: NonNullable<WeekPick>): WeekSpan {
  const end = pick.last ?? pick.first;
  const [lo, hi] = pick.first <= end ? [pick.first, end] : [end, pick.first];
  const start = weekStart(lo);
  return { start, weeks: daysBetween(start, weekStart(hi)) / 7 + 1 };
}

/** Where "Add on this day" goes: the day, and the block it falls in. */
export function addOnDayHref(date: CalendarDate, block: Block | null): string {
  return `/plan/add?date=${date}${block === null ? "" : `&blockId=${encodeURIComponent(block.id)}`}`;
}

/** Where picking weeks continues: naming the block. */
export const newBlockHref = (span: WeekSpan): string =>
  `/plan/block/new?start=${span.start}&weeks=${span.weeks}`;
