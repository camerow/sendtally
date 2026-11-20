import React from "react";
import { currentPhase, hasNextSet, type Phase } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { HangTimer } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";

export type TimerControlsProps<P extends Phase> = {
  timer: HangTimer<P>;
  color: string;
  /** What the round button does: Pause, Resume, or Lifted on a lift. */
  primary: string;
};

/** One row: set back, restart, a round pause, play or lift button in the phase's colour, skip, set forward. */
export function TimerControls<P extends Phase>({
  timer,
  color,
  primary,
}: TimerControlsProps<P>): React.ReactElement {
  const icon =
    currentPhase(timer.run).taps > 0 ? "check" : timer.run.pausedAt === null ? "pause" : "play";
  return (
    <div className="timer-buttons">
      <button
        type="button"
        className="timer-icon"
        aria-label={t("hang.previousSet")}
        disabled={timer.run.index === 0}
        onClick={timer.previousSet}
      >
        <Icon name="back" size={18} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className="timer-icon"
        aria-label={t("hang.restartInterval")}
        onClick={timer.restart}
      >
        <Icon name="restart" size={22} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className="timer-primary"
        style={{ backgroundColor: color }}
        aria-label={primary}
        onClick={timer.primary}
      >
        <Icon name={icon} size={26} strokeWidth={3} />
      </button>
      <button
        type="button"
        className="timer-icon"
        aria-label={t("hang.skipInterval")}
        onClick={timer.skip}
      >
        <Icon name="skip" size={22} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className="timer-icon"
        aria-label={t("hang.nextSet")}
        disabled={!hasNextSet(timer.run)}
        onClick={timer.nextSet}
      >
        <Icon name="forward" size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
