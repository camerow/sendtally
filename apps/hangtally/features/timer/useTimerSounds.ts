import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import { currentPhase, isWork, type Run } from "@sendtally/core/hang";
import finishSound from "../../assets/sounds/finish.wav";
import liftSound from "../../assets/sounds/lift.wav";
import missSound from "../../assets/sounds/miss.wav";
import restSound from "../../assets/sounds/rest.wav";
import tickSound from "../../assets/sounds/tick.wav";
import workSound from "../../assets/sounds/work.wav";

const COUNTDOWN_FROM = 3;

export type Sound = "tick" | "work" | "rest" | "lift" | "miss" | "finish";

/**
 * Ticks on the last three seconds, a tone on every phase change and at the
 * finish. Plays alongside the user's music and through the silent switch.
 */
export function useTimerSounds(run: Run, secondsLeft: number, muted: boolean): (s: Sound) => void {
  const players = {
    tick: useAudioPlayer(tickSound),
    work: useAudioPlayer(workSound),
    rest: useAudioPlayer(restSound),
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

  const phase = currentPhase(run);
  const paused = run.pausedAt !== null;
  React.useEffect(() => {
    if (run.index > 0 && run.finished === null) play(isWork(phase.kind) ? "work" : "rest");
  }, [run.index, run.finished, phase.kind, play]);

  React.useEffect(() => {
    if (run.finished !== null) play("finish");
  }, [run.finished, play]);

  React.useEffect(() => {
    if (!paused && phase.kind !== "pull" && secondsLeft > 0 && secondsLeft <= COUNTDOWN_FROM)
      play("tick");
  }, [secondsLeft, paused, phase.kind, play]);

  return play;
}
