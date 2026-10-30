import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import workSound from "../../../assets/sounds/work.wav";
import { useLiveRun } from "../../live-session/liveRun";

/**
 * Plays the hang timer's work tone when the live run's rest ends, whether its player is open
 * or minimised. Mounted once, at the app's root.
 */
export function useRestTone(): void {
  const endsAt = useLiveRun()?.rest?.endsAt;
  const work = useAudioPlayer(workSound);

  React.useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  }, []);

  React.useEffect(() => {
    if (endsAt === undefined || endsAt <= Date.now()) return;
    const timer = setTimeout(() => {
      void work.seekTo(0);
      work.play();
    }, endsAt - Date.now());
    return () => clearTimeout(timer);
  }, [endsAt, work]);
}
