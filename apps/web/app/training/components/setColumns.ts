import type { SetDone } from "@sendtally/core/hang";

/**
 * The one set grid, shared by every row and its headings: position, then the fields filling the
 * row (count and measure sharing it 2 to 3 around the join), RPE where it is asked, and the tick.
 * Each is a class in training.css.
 */
export const SET_COLUMNS = {
  row: "set-cols",
  position: "set-pos",
  lead: "set-lead",
  count: "set-count",
  join: "set-join",
  measure: "set-measure",
  rpe: "set-rpe",
  rpeRead: "set-rpe-read",
  tick: "set-tick-col",
} as const;

/** Sets that are holds and nothing else, whose one column is the hold. */
export const holdsOnly = (sets: readonly SetDone[]): boolean =>
  sets.length > 0 && sets.every((s) => s.onS !== undefined && s.reps === undefined);
