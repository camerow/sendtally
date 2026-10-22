import { isWork, percentOf, phasesFor, phasesSeconds, plannedWork, type Phase } from "./protocol";
import type { Protocol } from "./types";

export type RepMark = "ok" | "miss";

/** A work phase that was finished, or cut short after `heldSeconds`. Skipped ones are absent. */
export type PhaseDone = { index: number; heldSeconds?: number };

/**
 * A timer run as plain data. Every transition takes `now` (ms) rather than
 * reading a clock, so the rules are testable and a run that sat in the
 * background catches up exactly when the app returns.
 */
export type Run<P extends Phase = Phase> = {
  phases: P[];
  sets: number;
  /** Work the run prescribes, in the units `work` counts: seconds held, or taps. */
  planned: number;
  index: number;
  phaseStartedAt: number;
  pausedAt: number | null;
  startedAt: number;
  taps: number;
  work: number;
  misses: number;
  marks: RepMark[];
  done: PhaseDone[];
  finished: { ended: boolean; at: number } | null;
};

export function startPhases<P extends Phase>(
  phases: P[],
  sets: number,
  planned: number,
  now: number
): Run<P> {
  return {
    phases,
    sets,
    planned,
    index: 0,
    phaseStartedAt: now,
    pausedAt: null,
    startedAt: now,
    taps: 0,
    work: 0,
    misses: 0,
    marks: [],
    done: [],
    finished: null,
  };
}

export function startRun(protocol: Protocol, now: number): Run {
  return startPhases(phasesFor(protocol), protocol.sets, plannedWork(protocol), now);
}

export function currentPhase<P extends Phase>(run: Run<P>): P {
  return run.phases[Math.min(run.index, run.phases.length - 1)] as P;
}

export function elapsedInPhase(run: Run, now: number): number {
  return Math.max(0, ((run.pausedAt ?? now) - run.phaseStartedAt) / 1000);
}

export function remainingInPhase(run: Run, now: number): number {
  return Math.max(0, currentPhase(run).seconds - elapsedInPhase(run, now));
}

/** 0 to 1 through the current phase: taps given, or time elapsed. */
export function phaseProgress(run: Run, now: number): number {
  const phase = currentPhase(run);
  if (phase.taps > 0) return run.taps / phase.taps;
  return phase.seconds === 0 ? 1 : Math.min(1, elapsedInPhase(run, now) / phase.seconds);
}

/** Share of the whole run behind the current phase, 0 to 100. */
export function runPercent(run: Run): number {
  const done = phasesSeconds(run.phases.slice(0, run.index));
  const total = phasesSeconds(run.phases);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

type Credit = { work?: number; mark?: RepMark; misses?: number; held?: number | "all" };

function advance<P extends Phase>(run: Run<P>, startedAt: number, credit: Credit = {}): Run<P> {
  const index = run.index + 1;
  const misses = run.misses + (credit.misses ?? 0) + (credit.mark === "miss" ? 1 : 0);
  const marks = credit.mark === undefined ? run.marks : [...run.marks, credit.mark];
  const done =
    credit.held === undefined
      ? run.done
      : [
          ...run.done,
          credit.held === "all"
            ? { index: run.index }
            : { index: run.index, heldSeconds: credit.held },
        ];
  const base = {
    ...run,
    work: run.work + (credit.work ?? 0),
    misses,
    done,
    taps: 0,
    pausedAt: null,
  };
  if (index >= run.phases.length)
    return { ...base, marks, finished: { ended: false, at: startedAt } };
  const next = run.phases[index] as P;
  const newSet = isWork(next.kind) && next.set !== currentPhase(run).set;
  return { ...base, index, phaseStartedAt: startedAt, marks: newSet ? [] : marks };
}

/** Moves past every timed phase that has run out, carrying the overflow into the next. */
export function tick<P extends Phase>(run: Run<P>, now: number): Run<P> {
  let r = run;
  while (r.finished === null && r.pausedAt === null) {
    const phase = currentPhase(r);
    if (phase.taps > 0 || elapsedInPhase(r, now) < phase.seconds) break;
    const endedAt = r.phaseStartedAt + phase.seconds * 1000;
    const credit: Credit = isWork(phase.kind)
      ? { work: phase.seconds, mark: "ok", held: "all" }
      : {};
    r = advance(r, endedAt, credit);
  }
  return r;
}

export function togglePause<P extends Phase>(run: Run<P>, now: number): Run<P> {
  if (run.pausedAt === null) return { ...run, pausedAt: now };
  return { ...run, phaseStartedAt: run.phaseStartedAt + (now - run.pausedAt), pausedAt: null };
}

/** Credits the whole seconds held, counts a miss, and moves on. */
export function cameOffEarly<P extends Phase>(run: Run<P>, now: number): Run<P> {
  const held = Math.floor(elapsedInPhase(run, now));
  return advance(run, now, { work: held, mark: "miss", held });
}

/** One tap of a tapped phase: a lift, or a counted step done. The last one moves on. */
export function logLift<P extends Phase>(run: Run<P>, ok: boolean, now: number): Run<P> {
  const mark: RepMark = ok ? "ok" : "miss";
  const work = ok ? 1 : 0;
  if (run.taps + 1 >= currentPhase(run).taps)
    return advance(run, now, { work, mark, held: "all" });
  return {
    ...run,
    taps: run.taps + 1,
    work: run.work + work,
    misses: run.misses + (ok ? 0 : 1),
    marks: [...run.marks, mark],
  };
}

/** A skipped timed work phase earns nothing and counts a miss; so does every untapped tap. */
export function skip<P extends Phase>(run: Run<P>, now: number): Run<P> {
  const phase = currentPhase(run);
  if (phase.taps > 0) return advance(run, now, { misses: phase.taps - run.taps });
  if (isWork(phase.kind)) return advance(run, now, { mark: "miss" });
  return advance(run, now);
}

/** Restarts the current phase; for a tapped phase that clears its taps. */
export function restartPhase<P extends Phase>(run: Run<P>, now: number): Run<P> {
  const restarted = { ...run, phaseStartedAt: now, pausedAt: null };
  if (currentPhase(run).taps === 0) return restarted;
  const ok = run.marks.filter((m) => m === "ok").length;
  return {
    ...restarted,
    taps: 0,
    marks: [],
    work: run.work - ok,
    misses: run.misses - (run.marks.length - ok),
  };
}

export function endRun<P extends Phase>(run: Run<P>, now: number): Run<P> {
  return { ...run, finished: { ended: true, at: now } };
}

/** Whole seconds from the start to the finish, or to now while running. */
export function runSeconds(run: Run, now: number): number {
  return Math.round(((run.finished?.at ?? now) - run.startedAt) / 1000);
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
  const ended = run.finished?.ended ?? true;
  const phase = currentPhase(run);
  const setsDone = !ended
    ? run.sets
    : phase.kind === "setrest"
      ? phase.set
      : Math.max(0, phase.kind === "ready" ? 0 : phase.set - 1);
  return {
    ended,
    setsDone,
    pct: percentOf(run.work, run.planned),
    work: run.work,
    misses: run.misses,
    seconds: runSeconds(run, run.phaseStartedAt),
  };
}
