import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Icon } from "../../components/Icon";

/** A rest still to start, which waits for play: the laps tally's rest after a lap. */
export function IdleRestRow({
  seconds,
  onStart,
}: {
  seconds: number;
  onStart: () => void;
}): React.ReactElement {
  return (
    <div className="player-row">
      <span className="player-row-line player-row-text">
        <span className="player-row-word">{t("hang.rest")}</span>
        <span className="player-row-clock">{elapsedClock(seconds)}</span>
      </span>
      <button
        type="button"
        className="player-row-action player-row-play"
        aria-label={t("tally.startRest")}
        onClick={onStart}
      >
        <Icon name="play" size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}
