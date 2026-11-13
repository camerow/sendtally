import React from "react";
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { currentPhase, type Run } from "@sendtally/core/hang";
import { phaseProgress } from "@sendtally/features/workouts";

/** The current phase's 0 to 1 progress, animated on the UI thread. */
export function usePhaseProgress(run: Run): SharedValue<number> {
  const progress = useSharedValue(0);
  const { kind, seconds, taps: needed } = currentPhase(run);
  const { index, phaseStartedAt, pausedAt, taps } = run;

  React.useEffect(() => {
    cancelAnimation(progress);
    const { from, to, ms } = phaseProgress(
      { seconds, taps: needed },
      { taps, phaseStartedAt, pausedAt },
      Date.now()
    );
    if (from === null) {
      progress.set(withTiming(to, { duration: ms, easing: Easing.out(Easing.cubic) }));
      return;
    }
    progress.set(from);
    if (to !== from) progress.set(withTiming(to, { duration: ms, easing: Easing.linear }));
  }, [progress, index, kind, seconds, phaseStartedAt, pausedAt, taps, needed]);

  return progress;
}
