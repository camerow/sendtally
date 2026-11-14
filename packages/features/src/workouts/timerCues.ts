import React from "react";
import { currentPhase, isWork, type PhaseKind, type Run } from "@sendtally/core/hang";

const COUNTDOWN_FROM = 3;

export type Sound = "tick" | "work" | "rest" | "lift" | "miss" | "finish";

/** The tone as a run reaches phase `index`: none for the first, none once it finishes. */
export function phaseCue(
  index: number,
  finished: boolean,
  kind: PhaseKind
): "work" | "rest" | null {
  if (index === 0 || finished) return null;
  return isWork(kind) ? "work" : "rest";
}

/** Whether the countdown ticks at `secondsLeft`: the last three seconds of a running timed phase. */
export function ticks(paused: boolean, taps: number, secondsLeft: number): boolean {
  return !paused && taps === 0 && secondsLeft > 0 && secondsLeft <= COUNTDOWN_FROM;
}

/** Ticks on the last three seconds, a tone on every phase change and at the finish. */
export function useTimerCues(run: Run, secondsLeft: number, play: (s: Sound) => void): void {
  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  React.useEffect(() => {
    const cue = phaseCue(run.index, run.finished !== null, phase.kind);
    if (cue !== null) play(cue);
  }, [run.index, run.finished, phase.kind, play]);

  React.useEffect(() => {
    if (run.finished !== null) play("finish");
  }, [run.finished, play]);

  React.useEffect(() => {
    if (ticks(paused, phase.taps, secondsLeft)) play("tick");
  }, [secondsLeft, paused, phase.taps, play]);
}
