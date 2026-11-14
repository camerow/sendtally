import React from "react";
import { t } from "../i18n";
import { elapsedClock } from "../sessions/years";
import { MORE_REST_S, type Rest } from "../workouts/restCountdown";
import type { RestClock } from "../workouts/useLiveRun";
import { enduranceLapValueLabel, FELL_AFTER_START, isCleanLap } from "./endurance";
import {
  allLapsDone,
  lapClockLabel,
  lapElapsed,
  lapLine,
  lapsClimb,
  withLapAdded,
  withLapLogged,
  withLapRest,
  withLapStarted,
} from "./exerciseLaps";
import type { ClimbDraft, LogSessionDraft } from "./types";
import type { LiveSession } from "./useLiveSession";

/** One lap done: how far it got, as a share of its target, and the rest it took after. */
export type LapRow = {
  label: string;
  value: string;
  share: number;
  clean: boolean;
  /** "1:30 rest", once its rest is over. */
  took: string;
};

export type LapsTally = {
  /** "Lap 3 of 5" style clock and the line under it. */
  clock: string;
  line: string;
  /** The circuit climb the laps log on, which the climb editor opens. */
  circuit: ClimbDraft | undefined;
  rows: LapRow[];
  /** The rest after the last lap: running, waiting for play, or none. */
  rest: { running: Rest; left: number } | { seconds: number } | null;
  /** The lap to go, none once all are done: Start for a time lap not yet going, else what it shows. */
  next: { label: string; startable: boolean; text: string } | null;
  timed: boolean;
  done: boolean;
  /** Fell and Sent are off. */
  off: boolean;
  sent: () => void;
  /** Ends the lap where it fell; true when the climber should say how far it got. */
  fell: () => boolean;
  startLap: () => void;
  startRest: () => void;
  moreRest: () => void;
  skipRest: () => void;
  addLap: () => void;
};

const restKey = (lap: number): string => `lap-${lap}`;

/**
 * A workout's circuit laps as they happen, one line per lap like sets: how far each got and the
 * rest after it, which starts on play. A moves lap ends on Sent, or Fell and how far it got; a
 * time lap counts on the wall and goes clean at its target, Fell keeping the time so far.
 */
export function useLapsTally(
  draft: LogSessionDraft,
  live: LiveSession,
  rest: RestClock,
  now: Date
): LapsTally | null {
  const ex = draft.exercise;
  const timed = ex?.lap?.unit === "seconds";
  const elapsed = ex === undefined ? null : lapElapsed(ex, now);
  const target = ex?.lap?.target ?? 0;
  const timeUp = timed && elapsed !== null && elapsed >= target;
  React.useEffect(() => {
    if (timeUp) live.replace(withLapLogged(draft, target));
  }, [timeUp, draft, live, target]);

  if (ex?.lap === undefined) return null;
  const circuit = lapsClimb(draft.climbs, ex.item);
  const e = circuit?.endurance;
  const laps = e?.laps ?? [];
  const done = allLapsDone(draft);
  const last = laps.length - 1;
  const restS = ex.restS;
  const running = rest.rest !== null && rest.rest.at === restKey(last) ? rest.rest : null;

  /** A rest still running when the next lap goes keeps the time it took so far. */
  const endRest = (d: LogSessionDraft): LogSessionDraft => {
    if (running === null) return d;
    rest.skip();
    return withLapRest(d, last, running.seconds - rest.left);
  };
  const log = (value: number): void => live.replace(withLapLogged(endRest(draft), value));

  return {
    clock: lapClockLabel(draft),
    line: lapLine(draft),
    circuit,
    rows:
      e === undefined
        ? []
        : laps.map((lap, i) => {
            const took = ex.rests?.[i];
            return {
              label: t("tally.lapLabel", { lap: i + 1 }),
              value: enduranceLapValueLabel(e, i),
              share: Math.min(lap, e.target) / e.target,
              clean: isCleanLap(e, i),
              took:
                took === undefined || (i === last && running !== null)
                  ? ""
                  : t("tally.restTook", { time: elapsedClock(took) }),
            };
          }),
    rest:
      done || laps.length === 0 || restS === 0
        ? null
        : running !== null
          ? { running, left: rest.left }
          : ex.rests?.[last] === undefined
            ? { seconds: restS }
            : null,
    next: done
      ? null
      : {
          label: t("tally.lapLabel", { lap: laps.length + 1 }),
          startable: timed && elapsed === null,
          text: timed
            ? `${elapsedClock(elapsed ?? 0)} / ${elapsedClock(target)}`
            : t("tally.onTheWall"),
        },
    timed,
    done,
    off: done || (timed && elapsed === null),
    sent: () => log(target),
    fell: () => {
      if (timed) {
        log(elapsed ?? 0);
        return false;
      }
      log(FELL_AFTER_START);
      return true;
    },
    startLap: () => live.replace(withLapStarted(endRest(draft), new Date())),
    startRest: () => {
      rest.tick(restKey(last), restS);
      live.replace(withLapRest(draft, last, restS));
    },
    moreRest: () => {
      rest.more();
      live.replace(withLapRest(draft, last, (ex.rests?.[last] ?? restS) + MORE_REST_S));
    },
    skipRest: () => live.replace(endRest(draft)),
    addLap: () => live.replace(withLapAdded(draft)),
  };
}
