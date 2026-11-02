import React from "react";
import { useLiveRun, writeHold, writeRest } from "../../live-session/liveRun";
import { holdEndsAt, pauseHold, resumeHold, startHold, type Hold } from "./holdClock";

export type HoldClock = {
  hold: Hold | null;
  /** Ticks while a hold runs, so its row and strip redraw. */
  now: number;
  /** ▶ on a row: any rest still running ends, as one clock runs at a time. */
  start: (at: string, name: string, targetS: number, sides: boolean) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

let owners = 0;

/** Whether a player is open to record its own hold. */
export const playerHolds = (): boolean => owners > 0;

/**
 * The live run's hold, with the time it is read at kept current; `onOver` hears when it reaches
 * its target, for the player to record it.
 */
export function useHold(onOver?: (hold: Hold) => void): HoldClock {
  const hold = useLiveRun()?.hold ?? null;
  const [now, setNow] = React.useState(Date.now);
  const over = React.useRef(onOver);
  React.useEffect(() => {
    over.current = onOver;
  });
  const owns = onOver !== undefined;
  React.useEffect(() => {
    if (!owns) return;
    owners += 1;
    return () => {
      owners -= 1;
    };
  }, [owns]);
  React.useEffect(() => {
    if (hold === null || hold.pausedAt !== null) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (at < holdEndsAt(hold)) return;
      clearInterval(timer);
      over.current?.(hold);
    }, 250);
    return () => clearInterval(timer);
  }, [hold]);
  return {
    hold,
    now,
    start: (at, name, targetS, sides) => {
      writeRest(null);
      const at0 = Date.now();
      setNow(at0);
      writeHold(startHold(at, name, targetS, sides, at0));
    },
    pause: () => {
      if (hold !== null) writeHold(pauseHold(hold, Date.now()));
    },
    resume: () => {
      if (hold === null) return;
      setNow(Date.now());
      writeHold(resumeHold(hold, Date.now()));
    },
    stop: () => writeHold(null),
  };
}
