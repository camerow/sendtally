import React from "react";
import {
  cameOffEarly,
  currentPhase,
  endRun,
  logLift,
  nextSet,
  previousSet,
  remainingInPhase,
  restartPhase,
  skip,
  tick,
  togglePause,
  type Phase,
  type Run,
} from "@sendtally/core/hang";

const TICK_MS = 100;

export type RunControls<P extends Phase = Phase> = {
  run: Run<P>;
  /** Whole seconds left in a timed phase, as the countdown shows it. */
  secondsLeft: number;
  togglePause: () => void;
  cameOffEarly: () => void;
  logLift: (ok: boolean) => void;
  skip: () => void;
  restart: () => void;
  previousSet: () => void;
  nextSet: () => void;
  end: () => void;
};

/**
 * Drives a run from the wall clock. The screen re-renders only on a phase
 * change or a new countdown second; the smooth parts animate on the UI thread.
 */
export function useRun<P extends Phase>(start: (now: number) => Run<P>): RunControls<P> {
  const [initial] = React.useState(() => start(Date.now()));
  const current = React.useRef(initial);
  const [run, setRun] = React.useState(initial);
  const [secondsLeft, setSecondsLeft] = React.useState(() => currentPhase(initial).seconds);

  const apply = React.useCallback((step: (r: Run<P>, now: number) => Run<P>) => {
    const now = Date.now();
    const next = step(current.current, now);
    current.current = next;
    setRun(next);
    setSecondsLeft(Math.ceil(remainingInPhase(next, now)));
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => apply((r, now) => tick(r, now)), TICK_MS);
    return () => clearInterval(timer);
  }, [apply]);

  return {
    run,
    secondsLeft,
    togglePause: () => apply((r, now) => togglePause(r, now)),
    cameOffEarly: () => apply((r, now) => cameOffEarly(r, now)),
    logLift: (ok) => apply((r, now) => logLift(r, ok, now)),
    skip: () => apply((r, now) => skip(r, now)),
    restart: () => apply((r, now) => restartPhase(r, now)),
    previousSet: () => apply((r, now) => previousSet(r, now)),
    nextSet: () => apply((r, now) => nextSet(r, now)),
    end: () => apply((r, now) => endRun(r, now)),
  };
}
