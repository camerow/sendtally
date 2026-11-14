import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";

export type TimerControlsProps = {
  color: string;
  primary: string;
  /** What comes after this phase; null leaves the line out. */
  next: string | null;
  fail: string | null;
  onPrimary: () => void;
  onFail: () => void;
  onRestart: () => void;
  onSkip: () => void;
};

/** Came off early / missed lift, what comes next, and restart · primary · skip. */
export function TimerControls({
  color,
  primary,
  next,
  fail,
  onPrimary,
  onFail,
  onRestart,
  onSkip,
}: TimerControlsProps): React.ReactElement {
  return (
    <div className="timer-controls">
      {fail !== null && (
        <button type="button" className="timer-fail" onClick={onFail}>
          {fail}
        </button>
      )}
      {next !== null && (
        <div className="timer-next">
          <span className="timer-label">{t("hang.next")}</span>
          <span className="timer-next-text">{next}</span>
        </div>
      )}
      <div className="timer-buttons">
        <button
          type="button"
          className="timer-icon timer-icon--big"
          aria-label={t("hang.restartInterval")}
          onClick={onRestart}
        >
          <Icon name="restart" size={22} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="timer-primary"
          style={{ backgroundColor: color }}
          onClick={onPrimary}
        >
          {primary}
        </button>
        <button
          type="button"
          className="timer-icon timer-icon--big"
          aria-label={t("hang.skipInterval")}
          onClick={onSkip}
        >
          <Icon name="skip" size={22} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
