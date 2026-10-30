import { GET_READY_S, phasesFor, plannedWork, type Phase } from "./protocol";
import type { Dose, SetDone } from "./plan";
import { startPhases, type Run } from "./timer";
import type { Protocol } from "./types";

/** A phase of a hangboard workout run, and the item it belongs to. */
export type HangPhase = Phase & { item: number };

/**
 * Every item's phases in turn. Each item after the first opens with the rest
 * between exercises where the first has Get ready; no rest still gets Get ready.
 */
export function workoutPhases(protocols: readonly Protocol[], exerciseRestS: number): HangPhase[] {
  return protocols.flatMap((p, item) =>
    phasesFor(p).map((phase, i) =>
      item > 0 && i === 0
        ? { ...phase, seconds: exerciseRestS > 0 ? exerciseRestS : GET_READY_S, item }
        : { ...phase, item }
    )
  );
}

export function startWorkoutRun(
  protocols: readonly Protocol[],
  exerciseRestS: number,
  now: number
): Run<HangPhase> {
  return startPhases(
    workoutPhases(protocols, exerciseRestS),
    protocols[0]?.sets ?? 0,
    protocols.reduce((sum, p) => sum + plannedWork(p), 0),
    now
  );
}

/**
 * What each set of each item held, against its dose: the dose in full, the hangs held in full
 * when fewer, a lone hang's seconds when it was cut short, or null when nothing in it held.
 */
export function setsHeld(run: Run<HangPhase>, doses: readonly Dose[]): (SetDone | null)[][] {
  const held = doses.map((d) => Array.from({ length: d.sets }, () => ({ full: 0, cutS: 0 })));
  for (const { index, heldSeconds } of run.done) {
    const phase = run.phases[index];
    const set = phase === undefined ? undefined : held[phase.item]?.[phase.set - 1];
    if (phase === undefined || set === undefined) continue;
    // ponytail: a set of lifts counts its every rep, misses and all; per-lift marks if it matters.
    if (heldSeconds === undefined) set.full += phase.taps > 0 ? phase.taps : 1;
    else set.cutS = Math.max(set.cutS, heldSeconds);
  }
  return doses.map(({ sets: _, name: __, ...dose }, item) =>
    (held[item] ?? []).map(({ full, cutS }) => {
      const reps = dose.reps ?? 1;
      if (full >= reps) return dose;
      if (full > 0) return { ...dose, reps: full };
      return reps === 1 && cutS > 0 ? { ...dose, onS: cutS } : null;
    })
  );
}
