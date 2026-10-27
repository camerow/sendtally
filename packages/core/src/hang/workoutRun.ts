import { GET_READY_S, phasesFor, plannedWork, type Phase } from "./protocol";
import { currentPhase, resultOf, startPhases, type Run } from "./timer";
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

/** The sets each item finished: all of those before where the run stopped, none after. */
export function setsDoneByItem(run: Run<HangPhase>, sets: readonly number[]): number[] {
  const at = currentPhase(run).item;
  const ended = run.finished?.ended ?? true;
  const here = resultOf(run).setsDone;
  return sets.map((n, item) => (!ended || item < at ? n : item > at ? 0 : here));
}
