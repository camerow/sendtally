import React from "react";
import { useLiveRun, writeRest } from "../../live-session/liveRun";
import { restAfter, restLeft, withMoreRest, type Rest } from "@sendtally/features/workouts";

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

/**
 * The one rest a player runs at a time, kept with the live run so it outlasts the screen;
 * `useRestTone` plays its end.
 */
export function useRest(): RestClock {
  const stored = useLiveRun()?.rest ?? null;
  const left = useRestLeft(stored);
  return {
    rest: left > 0 ? stored : null,
    left,
    tick: (at, seconds, next) => writeRest(restAfter(at, seconds, next ?? null, Date.now())),
    more: () => {
      if (stored !== null) writeRest(withMoreRest(stored));
    },
    skip: () => writeRest(null),
  };
}
