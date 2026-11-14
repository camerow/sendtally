import React from "react";
import { t } from "@sendtally/features/i18n";
import { holdRowVM, type Hold } from "@sendtally/features/workouts";

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
  const vm = holdRowVM(hold, now);
  return (
    <div className="player-row player-row--hold" role="timer" aria-label={vm.label}>
      <span
        className="player-row-fill player-row-fill--hold"
        style={{ width: `${vm.share * 100}%` }}
      />
      {lead ?? <span className="player-row-gap" />}
      <span className="player-row-text">
        <span className="player-row-line">
          {vm.word !== null && <span className="player-row-word">{vm.word}</span>}
          <span className="player-row-clock">{vm.clock}</span>
          {vm.of !== null && <span className="player-row-of">{vm.of}</span>}
        </span>
      </span>
      <button type="button" className="player-row-action" onClick={vm.paused ? onResume : onPause}>
        {vm.paused ? t("hang.resume") : t("hang.pause")}
      </button>
      <button type="button" className="player-row-action" onClick={onDone}>
        {t("common.done")}
      </button>
    </div>
  );
}
