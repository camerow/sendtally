import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import type { SharedValue } from "react-native-reanimated";
import type { Phase, Run } from "@sendtally/core/hang";
import { usePhaseProgress } from "./usePhaseProgress";
import { useRun, type RunControls } from "./useRun";
import { useTimerSounds, type Sound } from "./useTimerSounds";

export type Timer<P extends Phase = Phase> = RunControls<P> & {
  progress: SharedValue<number>;
  play: (sound: Sound) => void;
  muted: boolean;
  toggleMute: () => void;
};

/** Everything a timer screen runs on: the clock, the live progress, the sounds, and the screen kept awake. */
export function useTimer<P extends Phase>(start: (now: number) => Run<P>): Timer<P> {
  useKeepAwake();
  const [muted, setMuted] = React.useState(false);
  const controls = useRun(start);
  const progress = usePhaseProgress(controls.run);
  const play = useTimerSounds(controls.run, controls.secondsLeft, muted);
  return { ...controls, progress, play, muted, toggleMute: () => setMuted((m) => !m) };
}
