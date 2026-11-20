import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Icon } from "../../components/Icon";
import { playTone } from "../../lib/tones";

export type WallClockProps = {
  /** The set's time on the wall. */
  targetS: number;
  left: number;
  running: boolean;
  onToggle: () => void;
};

/**
 * A timed climbing set's clock, under its climbs: only its own button starts and pauses it, with
 * a tone on start, on stop and on reaching its time.
 */
export function WallClock({
  targetS,
  left,
  running,
  onToggle,
}: WallClockProps): React.ReactElement {
  const was = React.useRef({ running, left });
  React.useEffect(() => {
    const before = was.current;
    was.current = { running, left };
    if (running && !before.running) playTone("work");
    else if (before.running && before.left > 0 && left === 0) playTone("finish");
    else if (before.running && !running && before.left > 0) playTone("rest");
  }, [running, left]);
  const clock = elapsedClock(targetS - left);
  const of = t("activities.holdOf", { time: elapsedClock(targetS) });
  const word = t("tally.onTheWall");
  const share = targetS > 0 ? (targetS - left) / targetS : 0;
  return (
    <div
      className="player-row player-row--hold wall-clock"
      role="timer"
      aria-label={`${word} ${clock} ${of}`}
    >
      <span
        className="player-row-fill player-row-fill--hold"
        style={{ width: `${share * 100}%` }}
      />
      <span className="player-row-gap" />
      <span className="player-row-text">
        <span className="player-row-line">
          <span className="player-row-word">{word}</span>
          <span className="player-row-clock">{clock}</span>
          <span className="player-row-of">{of}</span>
        </span>
      </span>
      <button
        type="button"
        className="wall-clock-button"
        aria-label={running ? t("hang.pause") : t("hang.start")}
        disabled={left === 0}
        onClick={onToggle}
      >
        <Icon name={running ? "pause" : "play"} size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
