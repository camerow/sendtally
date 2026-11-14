import { addDays, isDated, weekday, type Block, type CalendarDate } from "@sendtally/core/hang";
import { trainingDay, type TrainingLog } from "./days";
import type { Occurrence } from "./plan";
import type { CellMark } from "./planGridRows";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

const weekFrom = (block: Block, week: number | undefined): CalendarDate | null =>
  isDated(block) && week !== undefined ? addDays(block.start, (week - 1) * 7) : null;

/**
 * A scheduled block's week by weekday, Monday first: a block week runs from its start's
 * weekday, so each weekday column finds its own date. None on a template.
 */
export function blockWeekDates(block: Block, week: number | undefined): CalendarDate[] | null {
  const from = weekFrom(block, week);
  return from === null ? null : DAYS.map((d) => addDays(from, (d - weekday(from) + 7) % 7));
}

/** The weekdays left to right as the week runs, from its start's weekday; none on a template. */
export function blockWeekColumns(block: Block, week: number | undefined): number[] | undefined {
  const from = weekFrom(block, week);
  return from === null ? undefined : DAYS.map((i) => weekday(addDays(from, i)));
}

/** What is planned on each of those dates. */
export const weekPlans = (
  log: TrainingLog,
  dates: readonly CalendarDate[],
  today: CalendarDate
): Occurrence[][] => dates.map((date) => trainingDay(log, date, today).plans);

/** How a plan went on a day: none when it was not on it, moved in when it was moved there. */
export function cellMark(plans: readonly Occurrence[], membershipId: string): CellMark | null {
  const o = plans.find((x) => x.membership.id === membershipId);
  return o === undefined
    ? null
    : o.movedFrom !== null && o.status === "planned"
      ? "movedIn"
      : o.status;
}
