import { completion, isWork, phasesFor, phaseWeight, totalSeconds, type Phase } from "./protocol";
import type { Protocol } from "./types";

export type RepMark = "ok" | "miss";

/**
 * A timer run as plain data. Every transition takes `now` (ms) rather than
 * reading a clock, so the rules are testable and a run that sat in the
 * background catches up exactly when the app returns.
 */
export type Run = {
  protocol: Protocol;
  phases: Phase[];
  index: number;
  phaseStartedAt: number;
  pausedAt: number | null;
  startedAt: number;
  taps: number;
  work: number;
  misses: number;
  marks: RepMark[];
  finished: { ended: boolean; at: number } | null;
};

export function startRun(protocol: Protocol, now: number): Run {
  return {
    protocol,
    phases: phasesFor(protocol),
    index: 0,
    phaseStartedAt: now,
    pausedAt: null,
    startedAt: now,
    taps: 0,
    work: 0,
    misses: 0,
    marks: [],
    finished: null,
  };
}

export function currentPhase(run: Run): Phase {
  return run.phases[Math.min(run.index, run.phases.length - 1)] as Phase;
}

export function elapsedInPhase(run: Run, now: number): number {
  return Math.max(0, ((run.pausedAt ?? now) - run.phaseStartedAt) / 1000);
}

export function remainingInPhase(run: Run, now: number): number {
  return Math.max(0, currentPhase(run).seconds - elapsedInPhase(run, now));
}

/** 0 to 1 through the current phase: lifts tapped, or time elapsed. */
export function phaseProgress(run: Run, now: number): number {
  const phase = currentPhase(run);
  if (phase.kind === "pull") return run.taps / run.protocol.reps;
  return phase.seconds === 0 ? 1 : Math.min(1, elapsedInPhase(run, now) / phase.seconds);
}

/** Share of the whole run behind the current phase, 0 to 100. */
export function runPercent(run: Run): number {
  const done = run.phases
    .slice(1, run.index)
    .reduce((sum, phase) => sum + phaseWeight(phase, run.protocol), 0);
  const total = totalSeconds(run.protocol);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

type Credit = { work?: number; mark?: RepMark; misses?: number };

function advance(run: Run, startedAt: number, credit: Credit = {}): Run {
  const index = run.index + 1;
  const misses = run.misses + (credit.misses ?? 0) + (credit.mark === "miss" ? 1 : 0);
  const marks = credit.mark === undefined ? run.marks : [...run.marks, credit.mark];
  const base = { ...run, work: run.work + (credit.work ?? 0), misses, taps: 0, pausedAt: null };
  if (index >= run.phases.length)
    return { ...base, marks, finished: { ended: false, at: startedAt } };
  const next = run.phases[index] as Phase;
  const newSet = isWork(next.kind) && next.set !== currentPhase(run).set;
  return { ...base, index, phaseStartedAt: startedAt, marks: newSet ? [] : marks };
}

/** Moves past every timed phase that has run out, carrying the overflow into the next. */
export function tick(run: Run, now: number): Run {
  let r = run;
  while (r.finished === null && r.pausedAt === null) {
    const phase = currentPhase(r);
    if (phase.kind === "pull" || elapsedInPhase(r, now) < phase.seconds) break;
    const endedAt = r.phaseStartedAt + phase.seconds * 1000;
    r = advance(r, endedAt, phase.kind === "hang" ? { work: phase.seconds, mark: "ok" } : {});
  }
  return r;
}

export function togglePause(run: Run, now: number): Run {
  if (run.pausedAt === null) return { ...run, pausedAt: now };
  return { ...run, phaseStartedAt: run.phaseStartedAt + (now - run.pausedAt), pausedAt: null };
}

/** Credits the whole seconds held, counts a miss, and moves on. */
export function cameOffEarly(run: Run, now: number): Run {
  return advance(run, now, { work: Math.floor(elapsedInPhase(run, now)), mark: "miss" });
}

export function logLift(run: Run, ok: boolean, now: number): Run {
  const mark: RepMark = ok ? "ok" : "miss";
  const credit = { work: ok ? 1 : 0, mark };
  if (run.taps + 1 >= run.protocol.reps) return advance(run, now, credit);
  return {
    ...run,
    taps: run.taps + 1,
    work: run.work + credit.work,
    misses: run.misses + (ok ? 0 : 1),
    marks: [...run.marks, mark],
  };
}

/** A skipped hang earns nothing and counts a miss; so does every untapped lift. */
export function skip(run: Run, now: number): Run {
  const phase = currentPhase(run);
  if (phase.kind === "hang") return advance(run, now, { mark: "miss" });
  if (phase.kind === "pull") return advance(run, now, { misses: run.protocol.reps - run.taps });
  return advance(run, now);
}

/** Restarts the current phase; for a ground pull that clears the set's taps. */
export function restartPhase(run: Run, now: number): Run {
  const restarted = { ...run, phaseStartedAt: now, pausedAt: null };
  if (currentPhase(run).kind !== "pull") return restarted;
  const ok = run.marks.filter((m) => m === "ok").length;
  return {
    ...restarted,
    taps: 0,
    marks: [],
    work: run.work - ok,
    misses: run.misses - (run.marks.length - ok),
  };
}

export function endRun(run: Run, now: number): Run {
  return { ...run, finished: { ended: true, at: now } };
}

export type RunResult = {
  ended: boolean;
  setsDone: number;
  pct: number;
  work: number;
  misses: number;
  seconds: number;
};

export function resultOf(run: Run): RunResult {
  const at = run.finished?.at ?? run.phaseStartedAt;
  const ended = run.finished?.ended ?? true;
  const phase = currentPhase(run);
  const setsDone = !ended
    ? run.protocol.sets
    : phase.kind === "setrest"
      ? phase.set
      : Math.max(0, phase.kind === "ready" ? 0 : phase.set - 1);
  return {
    ended,
    setsDone,
    pct: completion(run.work, run.protocol),
    work: run.work,
    misses: run.misses,
    seconds: Math.round((at - run.startedAt) / 1000),
  };
}
