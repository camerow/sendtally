import React from "react";
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { currentPhase, type Run } from "@sendtally/core/hang";

const LIFT_MS = 260;

/**
 * 0 to 1 through the current phase, on the UI thread. A timed phase runs a
 * linear timing to 1 over what is left of it, pausing freezes it where it is,
 * and a lift eases to the new share of taps.
 */
export function usePhaseProgress(run: Run): SharedValue<number> {
  const progress = useSharedValue(0);
  const { kind, seconds } = currentPhase(run);
  const { index, phaseStartedAt, pausedAt, taps } = run;
  const reps = run.protocol.reps;

  React.useEffect(() => {
    cancelAnimation(progress);
    if (kind === "pull") {
      progress.set(
        withTiming(taps / reps, { duration: LIFT_MS, easing: Easing.out(Easing.cubic) })
      );
      return;
    }
    const elapsed = ((pausedAt ?? Date.now()) - phaseStartedAt) / 1000;
    const from = seconds === 0 ? 1 : Math.min(1, elapsed / seconds);
    progress.set(from);
    if (pausedAt === null && from < 1)
      progress.set(withTiming(1, { duration: (seconds - elapsed) * 1000, easing: Easing.linear }));
  }, [progress, index, kind, seconds, phaseStartedAt, pausedAt, taps, reps]);

  return progress;
}
