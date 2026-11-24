import React from "react";
import { MORE_REST_S, type Rest } from "../workouts/restCountdown";
import { useLatest } from "../workouts/useLatest";
import type { RestClock } from "../workouts/useLiveRun";
import {
  lapElapsed,
  lapsClimb,
  type LapPlan,
  withLapChanged,
  withLapLogged,
  withLapRemoved,
  withLapRest,
  withLapToggled,
  withLapUnlogged,
} from "./exerciseLaps";
import { withSetAdded } from "./exerciseTally";
import type { LogSessionDraft } from "./types";
import type { LiveSession } from "./useLiveSession";

export type LapsTally = {
  /** How far each lap logged got, in moves or seconds, oldest first. */
  laps: number[];
  /** Seconds the lap on the wall has run, up to its time, none before its clock first starts. */
  elapsed: number | null;
  /** The lap on the wall's clock is running. */
  running: boolean;
  /** The rest after the last lap: running, waiting for play, or none. */
  rest: { running: Rest; left: number } | { seconds: number } | null;
  /**
   * Logs the lap on the wall and each after it up to the one ticked, laps being climbed in order:
   * each this far in moves, or a time lap at its clock, its target before it starts or after the first.
   */
  tick: (moves: readonly number[]) => void;
  /** Starts or pauses the lap on the wall's clock, or, from a later lap, logs the laps before it, as `tick`, and starts its. */
  toggleLap: (before: readonly number[]) => void;
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
  /** What each lap asks for, from the item's dose, so a timed lap ends at its time wherever the tally is. */
  plan: LapPlan,
  /** The laps it asks for now, after any Add lap or −. */
  planned: number,
  on: () => LogSessionDraft,
  live: LiveSession,
  rest: RestClock,
  now: Date
): LapsTally {
  const ex = draft?.exercise?.item === item ? draft.exercise : undefined;
  const timed = plan.unit === "seconds";
  const clock = ex ?? draft?.lapClocks?.[item];
  const ran = clock === undefined ? null : lapElapsed(clock, now);
  const timeUp = timed && ran !== null && ran >= plan.target;
  const elapsed = ran === null || !timed ? ran : Math.min(ran, plan.target);
  const endLap = useLatest((): void => live.replace(withLapLogged(on(), plan.target)));
  React.useEffect(() => {
    if (timeUp) endLap.current();
  }, [timeUp, endLap]);

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
  const logged = (d: LogSessionDraft, moves: readonly number[]): LogSessionDraft => {
    const lap = d.exercise?.lap;
    const lapS = d.exercise === undefined ? null : lapElapsed(d.exercise, new Date());
    return moves.reduce(
      (x, m, i) =>
        withLapLogged(
          x,
          lap?.unit !== "seconds" ? m : i === 0 && lapS !== null ? lapS : lap.target
        ),
      endRest(d)
    );
  };

  return {
    laps,
    elapsed,
    running: clock?.setStartedAt !== undefined,
    rest:
      ex === undefined || laps.length === 0 || restS === 0
        ? null
        : running !== null
          ? { running, left: rest.left }
          : ex.rests?.[last] === undefined && laps.length < planned
            ? { seconds: restS }
            : null,
    tick: (moves) => edit((d) => logged(d, moves)),
    toggleLap: (before) => edit((d) => withLapToggled(logged(d, before), new Date())),
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
