import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { ClockToggle } from "./ClockToggle";

export type WallClockProps = {
  /** The set's time on the wall. */
  targetS: number;
  left: number;
  running: boolean;
  onToggle: () => void;
};

/**
 * A timed climbing set's clock, under its climbs: only its own button starts and pauses it.
 */
export function WallClock({
  targetS,
  left,
  running,
  onToggle,
}: WallClockProps): React.ReactElement {
  const clock = elapsedClock(targetS - left);
  const of = t("activities.holdOf", { time: elapsedClock(targetS) });
  const share = targetS > 0 ? (targetS - left) / targetS : 0;
  return (
    <div
      className="player-row player-row--hold wall-clock"
      role="timer"
      aria-label={`${clock} ${of}`}
    >
      <span
        className="player-row-fill player-row-fill--hold"
        style={{ width: `${share * 100}%` }}
      />
      <span className="player-row-gap" />
      <span className="player-row-text">
        <span className="player-row-line">
          <span className="player-row-clock">{clock}</span>
          <span className="player-row-of">{of}</span>
        </span>
      </span>
      <ClockToggle left={left} running={running} onToggle={onToggle} />
    </div>
  );
}
