import { phaseProgress, remainingInPhase, currentPhase, type Run } from "@sendtally/core/hang";

const LIFT_MS = 260;

/**
 * How the current phase's 0 to 1 progress moves from `now`: a timed phase jumps to where it is
 * and runs linearly to 1 over what is left, or holds still while paused; a lift eases from
 * wherever it is (`from` null) to the new share of taps.
 */
export type ProgressMove = { from: number | null; to: number; ms: number };

export function progressMove(run: Run, now: number): ProgressMove {
  const at = phaseProgress(run, now);
  if (currentPhase(run).taps > 0) return { from: null, to: at, ms: LIFT_MS };
  return run.pausedAt === null && at < 1
    ? { from: at, to: 1, ms: remainingInPhase(run, now) * 1000 }
    : { from: at, to: at, ms: 0 };
}
