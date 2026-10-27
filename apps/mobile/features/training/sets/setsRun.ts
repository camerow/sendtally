import type { ActivityKind } from "@sendtally/api-client";
import type { Item, ItemDone, SetDone } from "@sendtally/core/hang";

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

/** A lifting item: a strength exercise counted in reps, which takes a weight too. */
export const isLifting = (kind: ActivityKind, item: Item | undefined): boolean =>
  kind === "strength" && item !== undefined && item.dose.onS === undefined;

/** Each lifting set with the last run's reps and weight wherever the workout sets none. */
export const withPrevious = (
  done: readonly ItemDone[],
  lifting: (item: number) => boolean,
  previous: (exercise: string) => readonly SetDone[]
): ItemDone[] =>
  done.map((d) =>
    lifting(d.item)
      ? {
          ...d,
          sets: d.sets.map((s, i) => {
            const last = previous(d.exercise)[i];
            return { ...s, reps: s.reps ?? last?.reps, weightKg: s.weightKg ?? last?.weightKg };
          }),
        }
      : d
  );
