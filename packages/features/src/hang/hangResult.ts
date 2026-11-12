import type { HangSetup, ItemDone, SessionItem, SetDone } from "@sendtally/core/hang";
import { percentOf } from "@sendtally/core/hang";

/** Where a kept item was done: its grip, the edge and load it hung on, and whether it hangs or pulls. */
export type HangItemSetup = { exercise: string; setup: HangSetup; hang: boolean };

/** What a hangboard session saves: every kept set, how much of the plan it held, and the hangs it missed. */
export type HangResult = { done: ItemDone[]; pct: number; misses: number };

/** Seconds on the edge, or lifts, that sets hold; a set with no time of its own holds its dose's. */
const workOf = (sets: readonly SetDone[], dose: SetDone | undefined): number =>
  sets.reduce((n, s) => n + (s.reps ?? 1) * (s.onS ?? dose?.onS ?? 1), 0);

/**
 * A hangboard session as it saves: each kept set on its item's grip, on the edge when it hangs and
 * at the load unless one was set by hand. Held is seconds against what `prescribed` plans; a miss is
 * a hang short of its set's prescribed reps, and a set left out is not missed, just not held.
 */
export function hangResult(
  kept: readonly ItemDone[],
  prescribed: readonly SessionItem[],
  itemOf: (d: ItemDone) => HangItemSetup
): HangResult {
  const dose = (item: number): SessionItem["dose"] | undefined => prescribed[item]?.dose;
  const misses = kept.reduce(
    (n, d) =>
      n + d.sets.reduce((m, s) => m + Math.max(0, (dose(d.item)?.reps ?? 1) - (s.reps ?? 1)), 0),
    0
  );
  const planned = prescribed.reduce(
    (n, p) =>
      n +
      workOf(
        Array.from({ length: p.dose.sets }, () => p.dose),
        p.dose
      ),
    0
  );
  const held = kept.reduce((n, d) => n + workOf(d.sets, dose(d.item)), 0);
  const done = kept.map((d) => {
    const { exercise, setup, hang } = itemOf(d);
    return {
      item: d.item,
      exercise,
      sets: d.sets.map((s) => ({
        ...s,
        ...(hang ? { edgeMm: setup.edgeMm } : {}),
        weightKg: s.weightKg ?? setup.loadKg,
      })),
    };
  });
  return { done, pct: percentOf(held, planned), misses };
}
