import type { Phase } from "./protocol";
import { currentPhase, tick, type Run } from "./timer";

/** A phase with its wall-clock start and end; no end for one that waits for taps or is paused. */
export type ScheduledPhase<P extends Phase = Phase> = {
  index: number;
  phase: P;
  startsAt: number;
  endsAt: number | null;
};

export type Schedule<P extends Phase = Phase> = {
  phases: ScheduledPhase<P>[];
  /** When the run finishes on its own, if nothing stops the schedule before. */
  finishesAt: number | null;
};

export const SCHEDULE_LIMIT = 64;

/**
 * The phases ahead from `now`, the current one first, stepped with `tick` itself so the
 * schedule cannot disagree with the run. It stops at a paused or tapped phase, the finish,
 * or `limit` phases.
 */
export function upcomingPhases<P extends Phase>(
  run: Run<P>,
  now: number,
  limit = SCHEDULE_LIMIT
): Schedule<P> {
  const phases: ScheduledPhase<P>[] = [];
  let r = tick(run, now);
  while (r.finished === null && phases.length < limit) {
    const phase = currentPhase(r);
    const waits = r.pausedAt !== null || phase.taps > 0;
    const endsAt = waits ? null : r.phaseStartedAt + phase.seconds * 1000;
    phases.push({ index: r.index, phase, startsAt: r.phaseStartedAt, endsAt });
    if (endsAt === null) return { phases, finishesAt: null };
    r = tick(r, endsAt);
  }
  return { phases, finishesAt: r.finished?.at ?? null };
}
