import React from "react";
import { hasNextSet, type Phase } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { HangTimer } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";

export type SetArrowsProps<P extends Phase> = { timer: HangTimer<P>; label: string };

/** ‹ Set 2 of 5 ›: back replays a set, taking back what it logged; forward skips to the next. */
export function SetArrows<P extends Phase>({
  timer,
  label,
}: SetArrowsProps<P>): React.ReactElement {
  return (
    <div className="timer-arrows">
      <button
        type="button"
        className="timer-arrow"
        aria-label={t("hang.previousSet")}
        disabled={timer.run.index === 0}
        onClick={timer.previousSet}
      >
        <Icon name="back" size={20} strokeWidth={2.4} />
      </button>
      <span className="timer-arrows-label">{label}</span>
      <button
        type="button"
        className="timer-arrow"
        aria-label={t("hang.nextSet")}
        disabled={!hasNextSet(timer.run)}
        onClick={timer.nextSet}
      >
        <Icon name="forward" size={20} strokeWidth={2.4} />
      </button>
    </div>
  );
}
