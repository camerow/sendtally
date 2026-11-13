import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import type { Sound } from "@sendtally/features/workouts";
import finishSound from "../../../assets/sounds/finish.wav";
import liftSound from "../../../assets/sounds/lift.wav";
import missSound from "../../../assets/sounds/miss.wav";
import restSound from "../../../assets/sounds/rest.wav";
import tickSound from "../../../assets/sounds/tick.wav";
import workSound from "../../../assets/sounds/work.wav";

/** Plays a timer sound alongside the user's music and through the silent switch. */
export function useTimerSounds(): (s: Sound) => void {
  const players = {
    tick: useAudioPlayer(tickSound),
    work: useAudioPlayer(workSound),
    rest: useAudioPlayer(restSound),
    lift: useAudioPlayer(liftSound),
    miss: useAudioPlayer(missSound),
    finish: useAudioPlayer(finishSound),
  };
  React.useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  }, []);

  return (sound) => {
    const player = players[sound];
    void player.seekTo(0);
    player.play();
  };
}
