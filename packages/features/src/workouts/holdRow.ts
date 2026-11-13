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

export type StripVM = {
  kind: "rest" | "hold";
  /** "Rest 1:30", or the hold's name and its clock. */
  text: string;
  /** "· then set 2", "· of 0:30". */
  then: string | null;
  share: number;
  label: string | null;
};

/** What a rest is before: the exercise it names, else the set after the one it sits under. */
const restThen = (rest: Rest): string | null => {
  if (rest.next !== null) return t("activities.restThen", { name: rest.next });
  const set = /^\d+:(\d+)$/.exec(rest.at)?.[1];
  return set === undefined ? null : t("activities.restThenSet", { set: Number(set) + 2 });
};

/**
 * The live run's strip under the live bar while its player is minimised: its hold, else its rest;
 * none once either is over.
 */
export function stripVM(
  rest: Rest | null,
  left: number,
  hold: Hold | null,
  now: number
): StripVM | null {
  if (hold !== null) {
    const at = holdNow(hold, now);
    if (at.phase === "over") return null;
    const clock = at.phase === "hold" ? elapsedClock(at.seconds) : String(at.left);
    return {
      kind: "hold",
      text: `${hold.name} ${clock}`,
      then: `· ${t("activities.holdOf", { time: elapsedClock(hold.targetS) })}`,
      share: at.phase === "hold" ? Math.min(1, at.share) : 0,
      label: null,
    };
  }
  if (rest === null || left === 0) return null;
  const then = restThen(rest);
  return {
    kind: "rest",
    text: t("activities.restPreview", { time: elapsedClock(left) }),
    then: then === null ? null : `· ${then}`,
    share: left / rest.seconds,
    label: t("activities.restLeft", { time: elapsedClock(left) }),
  };
}
