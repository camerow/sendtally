import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import type { Rest } from "@sendtally/features/workouts";

export type RestRowProps = { rest: Rest; left: number; onMore: () => void; onSkip: () => void };

/**
 * A rest counting down inline: a gold fill drains with it, and it takes more time or a skip. A
 * row of the set table between sets, between the cards with what is next between exercises.
 */
export function RestRow({ rest, left, onMore, onSkip }: RestRowProps): React.ReactElement {
  const share = Math.min(1, left / rest.seconds);
  return (
    <div
      className="player-row player-row--rest"
      role="timer"
      aria-label={t("activities.restLeft", { time: elapsedClock(left) })}
    >
      <span
        className="player-row-fill player-row-fill--rest"
        style={{ width: `${share * 100}%` }}
      />
      <span className="player-row-text">
        <span className="player-row-line">
          <span className="player-row-word">{t("hang.rest")}</span>
          <span className="player-row-clock">{elapsedClock(left)}</span>
        </span>
        {rest.next !== null && (
          <span className="player-row-next">{t("activities.restNext", { name: rest.next })}</span>
        )}
      </span>
      <button type="button" className="player-row-action" onClick={onMore}>
        {t("activities.restMore")}
      </button>
      <button type="button" className="player-row-action" onClick={onSkip}>
        {t("activities.restSkip")}
      </button>
    </div>
  );
}
