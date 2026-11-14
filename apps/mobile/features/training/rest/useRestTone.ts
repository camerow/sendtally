import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import workSound from "../../../assets/sounds/work.wav";
import { useRestTone as useStoredRestTone } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";

/**
 * Plays the hang timer's work tone when the live run's rest ends, whether its player is open
 * or minimised. Mounted once, at the app's root.
 */
export function useRestTone(): void {
  const work = useAudioPlayer(workSound);
  React.useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  }, []);
  useStoredRestTone(liveRun, () => {
    void work.seekTo(0);
    work.play();
  });
}
