import { GET_READY_S, isWork, phasesSeconds, type Phase } from "./protocol";
import { startPhases, type Run } from "./timer";

export type IntervalSide = "L" | "R" | "each";

export type IntervalStep = {
  label: string;
  measure: "time" | "count";
  seconds?: number;
  count?: number;
  loadKg?: number;
  side?: IntervalSide;
  restAfter: number;
  cue?: string;
};

export type Intervals = { rounds: number; steps: IntervalStep[] };

/**
 * A phase of an intervals run. A timed step plays as a "hang" and a counted
 * one as a "pull" waiting for one tap; the rest after a round's last step is
 * a "setrest". `step` is the step a work phase plays, or the one a rest follows.
 */
export type IntervalPhase = Phase & { step: number; side?: "L" | "R" };

export type StepDone = { round: number; step: number; side?: "L" | "R"; heldSeconds?: number };

/** What a counted step counts for in durations, per rep. */
export const SECONDS_PER_COUNT = 3;

const sidesOf = (side: IntervalSide | undefined): ("L" | "R" | undefined)[] =>
  side === "each" ? ["L", "R"] : [side];

function workPhase(s: IntervalStep, set: number, step: number): IntervalPhase {
  const base = { set, rep: step + 1, step };
  return s.measure === "count"
    ? { ...base, kind: "pull", seconds: (s.count ?? 1) * SECONDS_PER_COUNT, taps: 1 }
    : { ...base, kind: "hang", seconds: s.seconds ?? 0, taps: 0 };
}

/** Every phase of the workout in order: each side of a step in turn, then its rest. */
export function intervalPhases(w: Intervals): IntervalPhase[] {
  const phases: IntervalPhase[] = [
    { kind: "ready", seconds: GET_READY_S, set: 1, rep: 1, taps: 0, step: 0 },
  ];
  const last = w.steps.length - 1;
  for (let set = 1; set <= w.rounds; set++) {
    w.steps.forEach((s, step) => {
      for (const side of sidesOf(s.side)) {
        const phase = workPhase(s, set, step);
        phases.push(side === undefined ? phase : { ...phase, side });
      }
      const final = set === w.rounds && step === last;
      if (s.restAfter > 0 && !final)
        phases.push({
          kind: step === last ? "setrest" : "rest",
          seconds: s.restAfter,
          set,
          rep: step + 1,
          taps: 0,
          step,
        });
    });
  }
  return phases;
}

/** Duration in seconds, excluding Get ready; a counted step counts for its reps. */
export function intervalSeconds(w: Intervals): number {
  return phasesSeconds(intervalPhases(w));
}

export function startIntervalsRun(w: Intervals, now: number): Run<IntervalPhase> {
  const phases = intervalPhases(w);
  const planned = phases.reduce((n, p) => n + (!isWork(p.kind) ? 0 : p.taps || p.seconds), 0);
  return startPhases(phases, w.rounds, planned, now);
}

/** Which steps the run finished or cut short, by 0-based round and step. */
export function stepsDone(run: Run<IntervalPhase>): StepDone[] {
  return run.done.flatMap(({ index, heldSeconds }) => {
    const phase = run.phases[index];
    if (phase === undefined) return [];
    return [
      {
        round: phase.set - 1,
        step: phase.step,
        ...(phase.side === undefined ? {} : { side: phase.side }),
        ...(heldSeconds === undefined ? {} : { heldSeconds }),
      },
    ];
  });
}
