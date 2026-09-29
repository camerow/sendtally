import type { Protocol } from "./types";

export type PhaseKind = "ready" | "hang" | "rest" | "setrest" | "pull";

export type Phase = { kind: PhaseKind; seconds: number; set: number; rep: number };

export const GET_READY_S = 5;

/** A ground pull has no clock; each lift counts this long towards duration. */
export const SECONDS_PER_LIFT = 6;

export const isWork = (kind: PhaseKind): boolean => kind === "hang" || kind === "pull";

export function phasesFor(p: Protocol): Phase[] {
  const phases: Phase[] = [{ kind: "ready", seconds: GET_READY_S, set: 1, rep: 1 }];
  for (let set = 1; set <= p.sets; set++) {
    if (p.kind === "pull") phases.push({ kind: "pull", seconds: 0, set, rep: 0 });
    else
      for (let rep = 1; rep <= p.reps; rep++) {
        phases.push({ kind: "hang", seconds: p.hangS, set, rep });
        if (rep < p.reps && p.restS > 0) phases.push({ kind: "rest", seconds: p.restS, set, rep });
      }
    if (set < p.sets && p.setRestS > 0)
      phases.push({ kind: "setrest", seconds: p.setRestS, set, rep: p.reps });
  }
  return phases;
}

/** How long a phase counts for in durations and the progress bar. */
export function phaseWeight(phase: Phase, p: Protocol): number {
  return phase.kind === "pull" ? p.reps * SECONDS_PER_LIFT : phase.seconds;
}

/** Duration in seconds, excluding Get ready. */
export function totalSeconds(p: Protocol): number {
  return phasesFor(p)
    .slice(1)
    .reduce((sum, phase) => sum + phaseWeight(phase, p), 0);
}

/** Seconds on the edge; zero for ground pulls. */
export function timeOnEdge(p: Protocol): number {
  return p.kind === "hang" ? p.reps * p.hangS * p.sets : 0;
}

/** Seconds of hanging, or lifts, the protocol prescribes. */
export function plannedWork(p: Protocol): number {
  return p.kind === "hang" ? p.reps * p.sets * p.hangS : p.reps * p.sets;
}

export function completion(work: number, p: Protocol): number {
  const planned = plannedWork(p);
  return planned === 0 ? 0 : Math.min(100, Math.round((work / planned) * 100));
}
