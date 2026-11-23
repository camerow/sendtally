import React from "react";
import { MORE_REST_S, type Rest } from "../workouts/restCountdown";
import type { RestClock } from "../workouts/useLiveRun";
import {
  lapElapsed,
  lapsClimb,
  withLapChanged,
  withLapLogged,
  withLapRemoved,
  withLapRest,
  withLapStarted,
  withLapUnlogged,
} from "./exerciseLaps";
import { withSetAdded } from "./exerciseTally";
import type { LogSessionDraft } from "./types";
import type { LiveSession } from "./useLiveSession";

export type LapsTally = {
  /** How far each lap logged got, in moves or seconds, oldest first. */
  laps: number[];
  /** Seconds the lap on the wall has run, none before its row is first pressed. */
  elapsed: number | null;
  /** The rest after the last lap: running, waiting for play, or none. */
  rest: { running: Rest; left: number } | { seconds: number } | null;
  /** Logs the lap on the wall: this far in moves, or a time lap at its clock, its target before it starts. */
  tick: (moves: number) => void;
  /** A time lap's clock starts with the first press on its row. */
  startLap: () => void;
  change: (lap: number, value: number) => void;
  untick: (lap: number) => void;
  startRest: () => void;
  moreRest: () => void;
  skipRest: () => void;
  addLap: () => void;
  /** Takes back a lap that holds nothing yet, none once one is left. */
  removeLap: (() => void) | null;
};

const restKey = (lap: number): string => `lap-${lap}`;

/**
 * A circuit item's laps, on the tally or off it: a row per lap ticked off the wall, moves preset to
 * the target, and the rest after the last, which starts on play. `on` puts the tally on the item.
 */
export function useLapsTally(
  draft: LogSessionDraft | null,
  item: number,
  /** The laps it asks for now, after any Add lap or −. */
  planned: number,
  on: () => LogSessionDraft,
  live: LiveSession,
  rest: RestClock,
  now: Date
): LapsTally {
  const ex = draft?.exercise?.item === item ? draft.exercise : undefined;
  const timed = ex?.lap?.unit === "seconds";
  const elapsed = ex === undefined ? null : lapElapsed(ex, now);
  const target = ex?.lap?.target ?? 0;
  const timeUp = timed && elapsed !== null && elapsed >= target;
  React.useEffect(() => {
    if (timeUp && draft !== null) live.replace(withLapLogged(draft, target));
  }, [timeUp, draft, live, target]);

  const laps = (draft === null ? undefined : lapsClimb(draft.climbs, item))?.endurance?.laps ?? [];
  const last = laps.length - 1;
  const restS = ex?.restS ?? 0;
  const running = rest.rest !== null && rest.rest.at === restKey(last) ? rest.rest : null;
  /** A rest still running when the next lap goes keeps the time it took so far. */
  const endRest = (d: LogSessionDraft): LogSessionDraft => {
    if (running === null) return d;
    rest.skip();
    return withLapRest(d, last, running.seconds - rest.left);
  };
  const edit = (f: (d: LogSessionDraft) => LogSessionDraft): void => live.replace(f(on()));

  return {
    laps,
    elapsed,
    rest:
      ex === undefined || laps.length === 0 || restS === 0
        ? null
        : running !== null
          ? { running, left: rest.left }
          : ex.rests?.[last] === undefined && laps.length < planned
            ? { seconds: restS }
            : null,
    tick: (moves) =>
      edit((d) => {
        const lapS = d.exercise === undefined ? null : lapElapsed(d.exercise, new Date());
        const unit = d.exercise?.lap;
        const value = unit?.unit === "seconds" ? (lapS ?? unit.target) : moves;
        return withLapLogged(endRest(d), value);
      }),
    startLap: () => edit((d) => withLapStarted(endRest(d), new Date())),
    change: (lap, value) => edit((d) => withLapChanged(d, item, lap, value)),
    untick: (lap) => edit((d) => withLapUnlogged(d, item, lap)),
    startRest: () => {
      if (ex === undefined || draft === null) return;
      rest.tick(restKey(last), restS);
      live.replace(withLapRest(draft, last, restS));
    },
    moreRest: () => {
      if (ex === undefined || draft === null) return;
      rest.more();
      live.replace(withLapRest(draft, last, (ex.rests?.[last] ?? restS) + MORE_REST_S));
    },
    skipRest: () => {
      if (draft !== null) live.replace(endRest(draft));
    },
    addLap: () => edit(withSetAdded),
    removeLap: planned > 1 && laps.length < planned ? () => edit(withLapRemoved) : null,
  };
}
