import { t } from "../i18n";
import { elapsedClock } from "../sessions/years";
import { holdNow, type Hold } from "./holdClock";
import type { Rest } from "./restCountdown";

export type HoldRowVM = {
  /** Ready, Switch, Left or Right; none while it just counts. */
  word: string | null;
  /** The count-in's seconds, then the time held. */
  clock: string;
  /** How far the fill has grown toward the target, 0 to 1. */
  share: number;
  /** "of 0:30", once the count-in is over. */
  of: string | null;
  paused: boolean;
  /** What a screen reader hears for the row. */
  label: string;
};

/** A timed set's row at `now`: its word, clock, fill and what it counts toward. */
export function holdRowVM(hold: Hold, now: number): HoldRowVM {
  const at = holdNow(hold, now);
  const word =
    at.phase === "countIn"
      ? t("activities.holdReady")
      : at.phase === "switch"
        ? t("activities.holdSwitch")
        : at.phase === "hold" && at.side !== null
          ? t(at.side === "L" ? "activities.holdLeft" : "activities.holdRight")
          : null;
  const clock =
    at.phase === "hold"
      ? elapsedClock(at.seconds)
      : at.phase === "over"
        ? elapsedClock(hold.targetS)
        : String(at.left);
  const target = t("activities.holdOf", { time: elapsedClock(hold.targetS) });
  return {
    word,
    clock,
    share: at.phase === "hold" ? Math.min(1, at.share) : at.phase === "over" ? 1 : 0,
    of: at.phase !== "countIn" && at.phase !== "switch" ? target : null,
    paused: hold.pausedAt !== null,
    label: [word, clock, target].filter((x) => x !== null).join(" "),
  };
}

export type RestRowVM = { clock: string; share: number; next: string | null; label: string };

/** A running rest's row: what is left, how full its fill still is, and what comes next. */
export function restRowVM(rest: Rest, left: number): RestRowVM {
  const clock = elapsedClock(left);
  return {
    clock,
    share: Math.min(1, left / rest.seconds),
    next: rest.next === null ? null : t("activities.restNext", { name: rest.next }),
    label: t("activities.restLeft", { time: clock }),
  };
}
