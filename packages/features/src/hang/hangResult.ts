import type { Dose, HangSetup, ItemDone, SessionItem, SetDone } from "@sendtally/core/hang";
import { heldSet, percentOf } from "@sendtally/core/hang";
import { keptSets, setKeyOf } from "../activities/done";

/** What a hang review saves: the sets that held anything and are not off; hang rows have no tick. */
export const keptHangs = (done: readonly ItemDone[], off: readonly string[]): ItemDone[] =>
  keptSets(done, [
    ...off,
    ...done.flatMap((d) => d.sets.flatMap((s, i) => (heldSet(s) ? [] : [setKeyOf(d.item, i)]))),
  ]);

/** Where a kept item was done: its grip, the edge and load it hung on, and whether it hangs or pulls. */
export type HangItemSetup = { exercise: string; setup: HangSetup; hang: boolean };

/** What a hangboard session saves: every kept set, how much of the plan it held, and the hangs it missed. */
export type HangResult = { done: ItemDone[]; pct: number; misses: number };

/** Seconds on the edge, or lifts, that sets hold; a set with no time of its own holds its dose's. */
const workOf = (sets: readonly SetDone[], dose: SetDone | undefined): number =>
  sets.reduce((n, s) => n + (s.reps ?? 1) * (s.onS ?? dose?.onS ?? 1), 0);

const setUp = (dose: Dose, setup: HangSetup, hang: boolean): Dose => ({
  ...dose,
  ...(hang && dose.edgeMm === undefined && setup.edgeMm > 0 && { edgeMm: setup.edgeMm }),
  ...(dose.weightKg === undefined && { weightKg: setup.loadKg }),
});

/**
 * A hangboard session as it saves: each kept set on its item's grip, on the edge when it hangs and
 * at the load unless one was set by hand. Held is seconds against what `prescribed` plans; a miss is
 * a hang short of its set's prescribed reps, and a set left out is not missed, just not held. A later
 * grip keeps the dose it ran, which its session has no other place for, and every grip the rest
 * the timer ran after it. A planned grip that held nothing saves with no sets, so what was planned
 * stays whole; the first saves one set of no hangs instead, since builds before this one read a
 * first grip with no sets as its share of the percentage held.
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
  const unheld = prescribed.flatMap((p, item): ItemDone[] =>
    p.dose.sets === 0 || kept.some((d) => d.item === item)
      ? []
      : [{ item, exercise: p.exercise, sets: item === 0 ? [{ reps: 0 }] : [] }]
  );
  const done = [...kept, ...unheld]
    .sort((a, b) => a.item - b.item)
    .map((d) => {
      const { exercise, setup, hang } = itemOf(d);
      const ran = d.item === 0 ? undefined : dose(d.item);
      const stored = ran !== undefined && ran.sets > 0;
      const rest = prescribed[d.item]?.restAfterS ?? 0;
      // A grip that held nothing has no set to carry its edge and load, so its dose does.
      const kept = stored && d.sets.length === 0 ? setUp(ran, setup, hang) : ran;
      return {
        item: d.item,
        exercise,
        ...(stored && { dose: kept }),
        ...(rest > 0 && { restAfterS: rest }),
        sets: d.sets.map((s) => ({
          ...s,
          ...(hang ? { edgeMm: setup.edgeMm } : {}),
          weightKg: s.weightKg ?? setup.loadKg,
        })),
      };
    });
  return { done, pct: percentOf(held, planned), misses };
}
