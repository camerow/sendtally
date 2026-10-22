import {
  blockWeekOn,
  maxDate,
  weekday,
  type Block,
  type CalendarDate,
  type Membership,
  type Weekday,
} from "@sendtally/core/hang";

/** Every week on some weekdays, or once on each of some dates. */
export type ScheduleMode = "repeat" | "dates";

export type ScheduleDraft = {
  mode: ScheduleMode;
  weekdays: Weekday[];
  dates: CalendarDate[];
  /** Where a weekly plan outside a block starts; inside one it starts with the block. */
  start: CalendarDate;
};

/** A new schedule, opened from a day: that weekday every week, or that date alone. */
export function newSchedule(date: CalendarDate | null, today: CalendarDate): ScheduleDraft {
  const from = date === null ? today : maxDate(date, today);
  return {
    mode: "repeat",
    weekdays: date === null ? [] : [weekday(date)],
    dates: date === null || date < today ? [] : [date],
    start: from,
  };
}

const ascending = <T extends string | number>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

/** The list with `x` added, or taken out when it was there, in order. */
export function toggled<T extends string | number>(list: readonly T[], x: T): T[] {
  return list.includes(x) ? list.filter((y) => y !== x) : [...list, x].sort(ascending);
}

const inside = (block: Block | null, d: CalendarDate): boolean =>
  block === null || blockWeekOn(block, d) !== null;

/** Whether the schedule says when: some weekdays, or some dates its block holds. */
export function scheduleReady(d: ScheduleDraft, block: Block | null): boolean {
  return d.mode === "repeat" ? d.weekdays.length > 0 : d.dates.some((date) => inside(block, date));
}

/**
 * What adding the workout on the schedule saves: one plan on its weekdays, or a
 * one-off plan per date. `newId` hands out the id of each.
 */
export function scheduledMemberships(
  d: ScheduleDraft,
  workoutId: string,
  block: Block | null,
  newId: () => string
): Membership[] {
  const blockId = block?.id ?? null;
  if (d.mode === "repeat")
    return [
      {
        id: newId(),
        workoutId,
        blockId,
        weekdays: [...d.weekdays].sort(ascending),
        start: block?.start ?? d.start,
      },
    ];
  return d.dates
    .filter((date) => inside(block, date))
    .sort(ascending)
    .map((date) => ({ id: newId(), workoutId, blockId, weekdays: [], start: date }));
}

/**
 * The plan moved into a block, starting with it, or out of its block, running on from
 * today or the block's start, whichever is later. A one-off keeps its date.
 */
export function movedTo(
  m: Membership,
  block: Block | null,
  from: Block | null,
  today: CalendarDate
): Membership {
  if (m.weekdays.length === 0) return { ...m, blockId: block?.id ?? null };
  if (block !== null) return { ...m, blockId: block.id, start: block.start };
  return { ...m, blockId: null, start: from === null ? m.start : maxDate(today, from.start) };
}
