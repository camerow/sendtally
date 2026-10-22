import type { Protocol } from "./types";

export type PhaseKind = "ready" | "hang" | "rest" | "setrest" | "pull";

/**
 * One stretch of a timed run. A phase with `taps` waits for that many taps
 * instead of a clock, and its `seconds` is only what it counts for in durations.
 */
export type Phase = { kind: PhaseKind; seconds: number; set: number; rep: number; taps: number };

export const GET_READY_S = 5;

/** A ground pull has no clock; each lift counts this long towards duration. */
export const SECONDS_PER_LIFT = 6;

export const isWork = (kind: PhaseKind): boolean => kind === "hang" || kind === "pull";

export function phasesFor(p: Protocol): Phase[] {
  const phases: Phase[] = [{ kind: "ready", seconds: GET_READY_S, set: 1, rep: 1, taps: 0 }];
  for (let set = 1; set <= p.sets; set++) {
    if (p.kind === "pull")
      phases.push({ kind: "pull", seconds: p.reps * SECONDS_PER_LIFT, set, rep: 0, taps: p.reps });
    else
      for (let rep = 1; rep <= p.reps; rep++) {
        phases.push({ kind: "hang", seconds: p.hangS, set, rep, taps: 0 });
        if (rep < p.reps && p.restS > 0)
          phases.push({ kind: "rest", seconds: p.restS, set, rep, taps: 0 });
      }
    if (set < p.sets && p.setRestS > 0)
      phases.push({ kind: "setrest", seconds: p.setRestS, set, rep: p.reps, taps: 0 });
  }
  return phases;
}

/** Duration in seconds of a run's phases, excluding Get ready. */
export function phasesSeconds(phases: readonly Phase[]): number {
  return phases.slice(1).reduce((sum, phase) => sum + phase.seconds, 0);
}

export function totalSeconds(p: Protocol): number {
  return phasesSeconds(phasesFor(p));
}

/** Seconds on the edge; zero for ground pulls. */
export function timeOnEdge(p: Protocol): number {
  return p.kind === "hang" ? p.reps * p.hangS * p.sets : 0;
}

/** Seconds of hanging, or lifts, the protocol prescribes. */
export function plannedWork(p: Protocol): number {
  return p.kind === "hang" ? p.reps * p.sets * p.hangS : p.reps * p.sets;
}

export function percentOf(work: number, planned: number): number {
  return planned === 0 ? 0 : Math.min(100, Math.round((work / planned) * 100));
}

export function completion(work: number, p: Protocol): number {
  return percentOf(work, plannedWork(p));
}
