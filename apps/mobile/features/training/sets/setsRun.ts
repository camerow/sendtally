import type { Item, ItemDone } from "@sendtally/core/hang";

/** One set of one item, by position. */
export type SetAt = { item: number; set: number };

export const setKey = ({ item, set }: SetAt): string => `${item}:${set}`;

/** Every set in order, item by item. */
export const allSets = (items: readonly Item[]): SetAt[] =>
  items.flatMap((it, item) => Array.from({ length: it.dose.sets }, (_, set) => ({ item, set })));

/** What was done: the ticked sets of each item, as they were entered. */
export const tickedDone = (done: readonly ItemDone[], ticked: ReadonlySet<string>): ItemDone[] =>
  done.map((d) => ({
    ...d,
    sets: d.sets.filter((_, set) => ticked.has(setKey({ item: d.item, set }))),
  }));
