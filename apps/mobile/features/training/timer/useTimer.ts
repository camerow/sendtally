import { useKeepAwake } from "expo-keep-awake";
import type { SharedValue } from "react-native-reanimated";
import type { Phase } from "@sendtally/core/hang";
import type { HangTimer } from "@sendtally/features/workouts";
import { usePhaseProgress } from "./usePhaseProgress";

export type Timer<P extends Phase = Phase> = HangTimer<P> & { progress: SharedValue<number> };

/** A player's timer on the phone: its live progress, with the screen kept awake. */
export function useTimer<P extends Phase>(timer: HangTimer<P>): Timer<P> {
  useKeepAwake();
  return { ...timer, progress: usePhaseProgress(timer.run) };
}
