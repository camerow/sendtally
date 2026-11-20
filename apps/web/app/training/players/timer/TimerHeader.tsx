import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { useGoBack } from "../../../lib/useGoBack";

export type TimerHeaderProps = {
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

/** Minimise, which leaves the run going on the live bar, then mute and End. */
export function TimerHeader({ muted, onEnd, onToggleMute }: TimerHeaderProps): React.ReactElement {
  const minimise = useGoBack("/app/plan");
  return (
    <div className="timer-head">
      <button
        type="button"
        className="timer-icon timer-icon--bare"
        aria-label={t("tally.minimise")}
        onClick={minimise}
      >
        <Icon name="down" size={24} strokeWidth={2} />
      </button>
      <span className="timer-head-space" />
      <button
        type="button"
        className="timer-icon"
        aria-label={muted ? t("hang.unmute") : t("hang.mute")}
        onClick={onToggleMute}
      >
        <Icon name={muted ? "muted" : "sound"} size={20} strokeWidth={2} />
      </button>
      <button type="button" className="timer-end" onClick={onEnd}>
        {t("hang.end")}
      </button>
    </div>
  );
}
