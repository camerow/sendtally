import type { Phase, Run } from "@sendtally/core/hang";

const LIFT_MS = 260;

/**
 * How the current phase's 0 to 1 progress moves: a timed phase jumps to where it is and runs
 * linearly to 1 over what is left, or holds still while paused; a lift eases from wherever it
 * is (`from` null) to the new share of taps.
 */
export type ProgressMove = { from: number | null; to: number; ms: number };

export function phaseProgress(
  { seconds, taps: needed }: Pick<Phase, "seconds" | "taps">,
  { taps, phaseStartedAt, pausedAt }: Pick<Run, "taps" | "phaseStartedAt" | "pausedAt">,
  now: number
): ProgressMove {
  if (needed > 0) return { from: null, to: taps / needed, ms: LIFT_MS };
  const elapsed = ((pausedAt ?? now) - phaseStartedAt) / 1000;
  const from = seconds === 0 ? 1 : Math.min(1, elapsed / seconds);
  return pausedAt === null && from < 1
    ? { from, to: 1, ms: (seconds - elapsed) * 1000 }
    : { from, to: from, ms: 0 };
}
