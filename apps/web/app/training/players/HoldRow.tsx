import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { holdNow, type Hold } from "@sendtally/features/workouts";

export type HoldRowProps = {
  hold: Hold;
  now: number;
  /** What sits first, as the set table's set number. */
  lead?: React.ReactNode;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
};

/**
 * A timed set running where it sits, the rest row's twin: a green fill grows toward the target
 * as it counts up, after a count-in, and Done ends it early.
 */
export function HoldRow({
  hold,
  now,
  lead,
  onPause,
  onResume,
  onDone,
}: HoldRowProps): React.ReactElement {
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
  const share = at.phase === "hold" ? Math.min(1, at.share) : at.phase === "over" ? 1 : 0;
  const paused = hold.pausedAt !== null;
  const of = t("activities.holdOf", { time: elapsedClock(hold.targetS) });
  return (
    <div
      className="player-row player-row--hold"
      role="timer"
      aria-label={[word, clock, of].filter((x) => x !== null).join(" ")}
    >
      <span
        className="player-row-fill player-row-fill--hold"
        style={{ width: `${share * 100}%` }}
      />
      {lead ?? <span className="player-row-gap" />}
      <span className="player-row-line player-row-text">
        {word !== null && <span className="player-row-word">{word}</span>}
        <span className="player-row-clock">{clock}</span>
        {at.phase !== "countIn" && at.phase !== "switch" && (
          <span className="player-row-next">{of}</span>
        )}
      </span>
      <button type="button" className="player-row-action" onClick={paused ? onResume : onPause}>
        {paused ? t("hang.resume") : t("hang.pause")}
      </button>
      <button type="button" className="player-row-action" onClick={onDone}>
        {t("common.done")}
      </button>
    </div>
  );
}
