import type { ActivityKind } from "@sendtally/api-client";
import { restAfterItem, type SessionItem, type ItemDone, type SetDone } from "@sendtally/core/hang";
import { setKeyOf } from "../activities/done";

/** One set of one item, by position. */
export type SetAt = { item: number; set: number };

export const setKey = ({ item, set }: SetAt): string => setKeyOf(item, set);

/** Every set in order, item by item. */
export const allSets = (items: readonly SessionItem[]): SetAt[] =>
  items.flatMap((it, item) => Array.from({ length: it.dose.sets }, (_, set) => ({ item, set })));

/** The items with each one's sets as many as it has so far, added or removed during the run. */
export const withDoneSets = (
  items: readonly SessionItem[],
  done: readonly Pick<ItemDone, "item" | "sets">[]
): SessionItem[] =>
  items.map((it, i) => {
    const n = done.find((d) => d.item === i)?.sets.length ?? it.dose.sets;
    return n === it.dose.sets ? it : { ...it, dose: { ...it.dose, sets: n } };
  });

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
 * to go, else its rest before the next exercise still to do. None
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
  if (next === -1) return null;
  return { at: afterKey(at.item), seconds: restAfterItem(items, at.item, exerciseRestS), next };
}

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

/**
 * "Exercise 2 of 3" over the cards in their order, counting each exercise once, a superset as
 * one, and a checklist (null) not at all: on a checklist it reads the next exercise after it not
 * already behind the run. None when the run holds no exercise.
 */
export function exercisePosition(
  order: readonly number[],
  on: number,
  unitOf: (item: number) => string | null,
  behind: (item: number) => boolean = () => false
): { at: number; of: number } | null {
  const units = [...new Set(order.flatMap((k) => unitOf(k) ?? []))];
  if (units.length === 0) return null;
  const from = Math.max(0, order.indexOf(on));
  const after = order.slice(from).filter((k) => unitOf(k) !== null);
  const at = unitOf(on) === null ? after.find((k) => !behind(k)) : after[0];
  const shown = (at === undefined ? null : unitOf(at)) ?? units[units.length - 1];
  return { at: Math.max(0, units.indexOf(shown ?? "")) + 1, of: units.length };
}
