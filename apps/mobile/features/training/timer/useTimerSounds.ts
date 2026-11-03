import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import type { Run } from "@sendtally/core/hang";
import finishSound from "../../../assets/sounds/finish.wav";
import liftSound from "../../../assets/sounds/lift.wav";
import missSound from "../../../assets/sounds/miss.wav";

export type Sound = "lift" | "miss" | "finish";

/**
 * The sounds a tap makes: a lift, a miss, and the finish when the run is ended by hand.
 * The scheduled cues (ticks, phase tones, a finish on time) play from the native timer.
 * Plays alongside the user's music and through the silent switch.
 */
export function useTimerSounds(run: Run, muted: boolean): (s: Sound) => void {
  const players = {
    lift: useAudioPlayer(liftSound),
    miss: useAudioPlayer(missSound),
    finish: useAudioPlayer(finishSound),
  };
  const latest = React.useRef({ players, muted });
  React.useEffect(() => {
    latest.current = { players, muted };
  });

  const play = React.useCallback((sound: Sound) => {
    if (latest.current.muted) return;
    const player = latest.current.players[sound];
    void player.seekTo(0);
    player.play();
  }, []);

  React.useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  }, []);

  React.useEffect(() => {
    if (run.finished?.ended === true) play("finish");
  }, [run.finished, play]);

  return play;
}
