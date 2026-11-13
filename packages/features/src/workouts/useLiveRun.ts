import React from "react";
import { holdEndsAt, pauseHold, resumeHold, startHold, type Hold } from "./holdClock";
import { holdCues, parseLiveRun, type HoldCue, type LiveRun, type LiveRunStore } from "./liveRun";
import { finishedRun } from "./finishedRun";
import { restAfter, restLeft, withMoreRest, type Rest } from "./restCountdown";

export function useLiveRun(store: LiveRunStore): LiveRun | null {
  const raw = React.useSyncExternalStore(store.storage.subscribe, store.storage.read, () => null);
  return React.useMemo(() => parseLiveRun(raw), [raw]);
}

export type RestClock = {
  /** The rest running, none once it is over. */
  rest: Rest | null;
  /** Whole seconds to go. */
  left: number;
  /** A tick: starts the rest after its row, ending any still running. */
  tick: (at: string, seconds: number, next?: string) => void;
  more: () => void;
  skip: () => void;
};

/** Whole seconds left on a rest, counted down live; zero once it is over. */
export function useRestLeft(rest: Rest | null): number {
  const [now, setNow] = React.useState(Date.now);
  const endsAt = rest?.endsAt;
  React.useEffect(() => {
    if (endsAt === undefined) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (at >= endsAt) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [endsAt]);
  return rest === null ? 0 : Math.min(rest.seconds, restLeft(rest, now));
}

/** The one rest a player runs at a time, kept with the live run so it outlasts the screen. */
export function useRest(store: LiveRunStore): RestClock {
  const stored = useLiveRun(store)?.rest ?? null;
  const left = useRestLeft(stored);
  return {
    rest: left > 0 ? stored : null,
    left,
    tick: (at, seconds, next) => store.writeRest(restAfter(at, seconds, next ?? null, Date.now())),
    more: () => {
      if (stored !== null) store.writeRest(withMoreRest(stored));
    },
    skip: () => store.writeRest(null),
  };
}

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
export function useHold(store: LiveRunStore, onOver?: (hold: Hold) => void): HoldClock {
  const hold = useLiveRun(store)?.hold ?? null;
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
      store.writeRest(null);
      const at0 = Date.now();
      setNow(at0);
      store.writeHold(startHold(at, name, targetS, sides, at0));
    },
    pause: () => {
      if (hold !== null) store.writeHold(pauseHold(hold, Date.now()));
    },
    resume: () => {
      if (hold === null) return;
      setNow(Date.now());
      store.writeHold(resumeHold(hold, Date.now()));
    },
    stop: () => store.writeHold(null),
  };
}

/**
 * Plays the live run's hold, open or minimised, through `play`, and records it at its target
 * while no player is open, so its rest runs on the strip. Mounted once, at the app's root.
 */
export function useLiveHold(store: LiveRunStore, play: (sound: HoldCue["sound"]) => void): void {
  const hold = useLiveRun(store)?.hold;
  const latest = React.useRef(play);
  React.useEffect(() => {
    latest.current = play;
  });
  const key = hold === undefined || hold.pausedAt !== null ? null : JSON.stringify(hold);
  React.useEffect(() => {
    if (key === null) return;
    const h = JSON.parse(key) as Hold;
    const now = Date.now();
    const timers = holdCues(h)
      .filter((c) => c.at > now - 150)
      .map((c) => setTimeout(() => latest.current(c.sound), Math.max(0, c.at - now)));
    const end = holdEndsAt(h);
    const finish = setTimeout(
      () => {
        const live = store.read();
        if (playerHolds() || live?.hold === undefined) return;
        store.writeAsIs(finishedRun(live, h.targetS, end));
      },
      Math.max(0, end - now)
    );
    return () => [...timers, finish].forEach(clearTimeout);
  }, [key, store]);
}

/** Plays `play` as the live run's rest ends, whether its player is open or minimised. */
export function useRestTone(store: LiveRunStore, play: () => void): void {
  const endsAt = useLiveRun(store)?.rest?.endsAt;
  const latest = React.useRef(play);
  React.useEffect(() => {
    latest.current = play;
  });
  React.useEffect(() => {
    if (endsAt === undefined || endsAt <= Date.now()) return;
    const timer = setTimeout(() => latest.current(), endsAt - Date.now());
    return () => clearTimeout(timer);
  }, [endsAt]);
}
