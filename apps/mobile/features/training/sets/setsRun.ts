import type { ActivityKind } from "@sendtally/api-client";
import type { SessionItem, ItemDone, SetDone } from "@sendtally/core/hang";

/** One set of one item, by position. */
export type SetAt = { item: number; set: number };

export const setKey = ({ item, set }: SetAt): string => `${item}:${set}`;

/** Every set in order, item by item. */
export const allSets = (items: readonly SessionItem[]): SetAt[] =>
  items.flatMap((it, item) => Array.from({ length: it.dose.sets }, (_, set) => ({ item, set })));

/** Whether every set of an item is ticked. */
export const itemDone = (
  items: readonly SessionItem[],
  ticked: ReadonlySet<string>,
  item: number
): boolean =>
  Array.from({ length: items[item]?.dose.sets ?? 0 }, (_, set) => setKey({ item, set })).every(
    (key) => ticked.has(key)
  );

/** Where the rest after an exercise shows: under its folded row. */
export const afterKey = (item: number): string => `after:${item}`;

/** The rest a tick starts: where it shows, how long, and the item it rests before. */
type RestStart = { at: string; seconds: number; next: number | null };

/**
 * The rest after a tick: the exercise's rest between sets under that set while it has sets
 * to go, else the workout's rest between exercises before the next one still to do. None
 * after the last.
 */
export function restAfterTick(
  items: readonly SessionItem[],
  ticked: ReadonlySet<string>,
  at: SetAt,
  exerciseRestS: number
): RestStart | null {
  if (!itemDone(items, ticked, at.item))
    return { at: setKey(at), seconds: items[at.item]?.dose.setRestS ?? 0, next: null };
  const next = items.findIndex((_, i) => i > at.item && !itemDone(items, ticked, i));
  return next === -1 ? null : { at: afterKey(at.item), seconds: exerciseRestS, next };
}

/** What was done: the ticked sets of each item, as they were entered. */
export const tickedDone = (done: readonly ItemDone[], ticked: ReadonlySet<string>): ItemDone[] =>
  done.map((d) => ({
    ...d,
    sets: d.sets.filter((_, set) => ticked.has(setKey({ item: d.item, set }))),
  }));

/** A lifting item: a strength exercise counted in reps, which takes a weight too. */
export const isLifting = (kind: ActivityKind, item: SessionItem | undefined): boolean =>
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
