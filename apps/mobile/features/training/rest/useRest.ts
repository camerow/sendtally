import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";
import { Vibration } from "react-native";
import workSound from "../../../assets/sounds/work.wav";
import { restAfter, restLeft, withMoreRest, type Rest } from "./restCountdown";

export type RestClock = {
  rest: Rest | null;
  /** Whole seconds to go. */
  left: number;
  /** A tick: starts the rest after its row, ending any still running. */
  tick: (at: string, seconds: number, next?: string) => void;
  more: () => void;
  skip: () => void;
};

/**
 * The one rest a player runs at a time. At zero it plays the hang timer's work tone and
 * buzzes, then clears.
 */
export function useRest(): RestClock {
  const [rest, setRest] = React.useState<Rest | null>(null);
  const [now, setNow] = React.useState(Date.now);
  const work = useAudioPlayer(workSound);

  React.useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  }, []);

  React.useEffect(() => {
    if (rest === null) return;
    const timer = setInterval(() => {
      const at = Date.now();
      if (at < rest.endsAt) {
        setNow(at);
        return;
      }
      void work.seekTo(0);
      work.play();
      Vibration.vibrate();
      setRest(null);
    }, 250);
    return () => clearInterval(timer);
  }, [rest, work]);

  const left = rest === null ? 0 : restLeft(rest, now);
  return {
    rest,
    left,
    tick: (at, seconds, next) => {
      const started = Date.now();
      setNow(started);
      setRest(restAfter(at, seconds, next ?? null, started));
    },
    more: () => setRest((r) => (r === null ? r : withMoreRest(r))),
    skip: () => setRest(null),
  };
}
