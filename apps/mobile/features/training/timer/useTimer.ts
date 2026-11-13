import { useKeepAwake } from "expo-keep-awake";
import type { SharedValue } from "react-native-reanimated";
import type { Phase, Run } from "@sendtally/core/hang";
import { useHangTimer, type HangTimer } from "@sendtally/features/workouts";
import { usePhaseProgress } from "./usePhaseProgress";
import { useTimerSounds } from "./useTimerSounds";

export type Timer<P extends Phase = Phase> = HangTimer<P> & { progress: SharedValue<number> };

/** Everything a timer screen runs on: the clock, the live progress, the sounds, and the screen kept awake. */
export function useTimer<P extends Phase>(start: (now: number) => Run<P>): Timer<P> {
  useKeepAwake();
  const timer = useHangTimer(start, useTimerSounds());
  return { ...timer, progress: usePhaseProgress(timer.run) };
}
