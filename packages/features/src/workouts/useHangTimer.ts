import React from "react";
import { currentPhase, type Phase, type Run } from "@sendtally/core/hang";
import { useTimerCues, type Sound } from "./timerCues";
import { useRun, type RunControls } from "./useRun";

export type HangTimer<P extends Phase = Phase> = RunControls<P> & {
  /** The ring and the primary button: log the lift on a pull, pause or resume otherwise. */
  primary: () => void;
  /** Came off early, or a missed lift on a pull. */
  fail: () => void;
  muted: boolean;
  toggleMute: () => void;
};

/** A run on the wall clock with its cues, played through the platform's `playSound` unless muted. */
export function useHangTimer<P extends Phase>(
  start: (now: number) => Run<P>,
  playSound: (s: Sound) => void
): HangTimer<P> {
  const [muted, setMuted] = React.useState(false);
  const controls = useRun(start);
  const latest = React.useRef({ playSound, muted });
  React.useEffect(() => {
    latest.current = { playSound, muted };
  });
  const play = React.useCallback((sound: Sound) => {
    if (!latest.current.muted) latest.current.playSound(sound);
  }, []);
  useTimerCues(controls.run, controls.secondsLeft, play);

  const logLift = (ok: boolean): void => {
    play(ok ? "lift" : "miss");
    controls.logLift(ok);
  };
  const pull = currentPhase(controls.run).taps > 0;
  return {
    ...controls,
    logLift,
    primary: pull ? () => logLift(true) : controls.togglePause,
    fail: pull ? () => logLift(false) : controls.cameOffEarly,
    muted,
    toggleMute: () => setMuted((m) => !m),
  };
}
