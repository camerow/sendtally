import React from "react";
import { t } from "@sendtally/features/i18n";
import { restRowVM, type Rest } from "@sendtally/features/workouts";

export type RestRowProps = { rest: Rest; left: number; onMore: () => void; onSkip: () => void };

/**
 * A rest counting down inline: a gold fill drains with it, and it takes more time or a skip. A
 * row of the set table between sets, between the cards with what is next between exercises.
 */
export function RestRow({ rest, left, onMore, onSkip }: RestRowProps): React.ReactElement {
  const vm = restRowVM(rest, left);
  return (
    <div className="player-row player-row--rest" role="timer" aria-label={vm.label}>
      <span
        className="player-row-fill player-row-fill--rest"
        style={{ width: `${vm.share * 100}%` }}
      />
      <span className="player-row-text">
        <span className="player-row-line">
          <span className="player-row-word">{t("hang.rest")}</span>
          <span className="player-row-clock">{vm.clock}</span>
        </span>
        {vm.next !== null && <span className="player-row-next">{vm.next}</span>}
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
