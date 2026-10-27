import type { Item, ItemDone } from "@sendtally/core/hang";

/** One set of one item, by position. */
export type SetAt = { item: number; set: number };

export const setKey = ({ item, set }: SetAt): string => `${item}:${set}`;

/** Every set in order, item by item. */
export const allSets = (items: readonly Item[]): SetAt[] =>
  items.flatMap((it, item) => Array.from({ length: it.dose.sets }, (_, set) => ({ item, set })));

/**
 * The rest after a set: the dose's own between its sets, the workout's between
 * exercises, none after the last.
 */
export function restAfter(items: readonly Item[], at: SetAt, exerciseRestS: number): number {
  const dose = items[at.item]?.dose;
  if (dose === undefined) return 0;
  if (at.set < dose.sets - 1) return dose.setRestS ?? dose.offS ?? exerciseRestS;
  return at.item < items.length - 1 ? exerciseRestS : 0;
}

/** What was done: the ticked sets of each item, as they were entered. */
export const tickedDone = (done: readonly ItemDone[], ticked: ReadonlySet<string>): ItemDone[] =>
  done.map((d) => ({
    ...d,
    sets: d.sets.filter((_, set) => ticked.has(setKey({ item: d.item, set }))),
  }));
