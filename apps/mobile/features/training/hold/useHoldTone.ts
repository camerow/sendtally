import { useAudioPlayer } from "expo-audio";
import React from "react";
import restSound from "../../../assets/sounds/rest.wav";
import tickSound from "../../../assets/sounds/tick.wav";
import workSound from "../../../assets/sounds/work.wav";
import { useLiveRun } from "../../live-session/liveRun";
import { COUNT_IN_S, SWITCH_S, type Hold } from "./holdClock";

type Cue = { at: number; sound: "tick" | "work" | "rest" };

/** A tick each second of the count-in, a tone as each side starts and as it ends. */
const cues = (h: Hold): Cue[] => {
  const s = (n: number): number => h.zeroAt + n * 1000;
  const count = Array.from({ length: COUNT_IN_S }, (_, i) => ({
    at: s(i - COUNT_IN_S),
    sound: "tick" as const,
  }));
  const right = h.targetS + SWITCH_S;
  return [
    ...count,
    { at: s(0), sound: "work" },
    ...(h.sides
      ? [
          { at: s(h.targetS), sound: "rest" as const },
          { at: s(right), sound: "work" as const },
          { at: s(right + h.targetS), sound: "rest" as const },
        ]
      : [{ at: s(h.targetS), sound: "rest" as const }]),
  ];
};

/** Plays the live run's hold, open or minimised. Mounted once, at the app's root. */
export function useHoldTone(): void {
  const hold = useLiveRun()?.hold;
  const players = {
    tick: useAudioPlayer(tickSound),
    work: useAudioPlayer(workSound),
    rest: useAudioPlayer(restSound),
  };
  const latest = React.useRef(players);
  React.useEffect(() => {
    latest.current = players;
  });
  const key = hold === undefined || hold.pausedAt !== null ? null : JSON.stringify(hold);
  React.useEffect(() => {
    if (key === null) return;
    const h = JSON.parse(key) as Hold;
    const now = Date.now();
    const timers = cues(h)
      .filter((c) => c.at > now - 150)
      .map((c) =>
        setTimeout(
          () => {
            const player = latest.current[c.sound];
            void player.seekTo(0);
            player.play();
          },
          Math.max(0, c.at - now)
        )
      );
    return () => timers.forEach(clearTimeout);
  }, [key]);
}
