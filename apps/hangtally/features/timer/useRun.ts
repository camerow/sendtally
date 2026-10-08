import React from "react";
import {
  cameOffEarly,
  currentPhase,
  endRun,
  logLift,
  remainingInPhase,
  restartPhase,
  skip,
  startRun,
  tick,
  togglePause,
  type Protocol,
  type Run,
} from "@sendtally/core/hang";

const TICK_MS = 100;

export type RunControls = {
  run: Run;
  /** Whole seconds left in a timed phase, as the countdown shows it. */
  secondsLeft: number;
  togglePause: () => void;
  cameOffEarly: () => void;
  logLift: (ok: boolean) => void;
  skip: () => void;
  restart: () => void;
  end: () => void;
};

/**
 * Drives a run from the wall clock. The screen re-renders only on a phase
 * change or a new countdown second; the smooth parts animate on the UI thread.
 */
export function useRun(protocol: Protocol): RunControls {
  const [initial] = React.useState(() => startRun(protocol, Date.now()));
  const current = React.useRef(initial);
  const [run, setRun] = React.useState(initial);
  const [secondsLeft, setSecondsLeft] = React.useState(() => currentPhase(initial).seconds);

  const apply = React.useCallback((step: (r: Run, now: number) => Run) => {
    const now = Date.now();
    const next = step(current.current, now);
    current.current = next;
    setRun(next);
    setSecondsLeft(Math.ceil(remainingInPhase(next, now)));
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => apply(tick), TICK_MS);
    return () => clearInterval(timer);
  }, [apply]);

  return {
    run,
    secondsLeft,
    togglePause: () => apply(togglePause),
    cameOffEarly: () => apply(cameOffEarly),
    logLift: (ok) => apply((r, now) => logLift(r, ok, now)),
    skip: () => apply(skip),
    restart: () => apply(restartPhase),
    end: () => apply(endRun),
  };
}
