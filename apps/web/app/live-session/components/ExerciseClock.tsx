import React from "react";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import type { RestClock } from "@sendtally/features/workouts";

export type ExerciseClockProps = { clock: Tally["clock"]; rest: RestClock };

/**
 * The tally's clock while it logs a workout exercise: the rest in gold between sets with more
 * time or a skip, a time set counting down, or the time since Start; the exercise, set and
 * climbs in the set under it.
 */
export function ExerciseClock({ clock, rest }: ExerciseClockProps): React.ReactElement {
  return (
    <div className="tally-clock">
      <span className={clock.resting ? "tally-time tally-time--rest" : "tally-time"}>
        {clock.time}
      </span>
      <span className="tally-summary">{clock.line}</span>
      {clock.resting && (
        <span className="tally-rest-actions">
          <button type="button" className="tally-pill" onClick={rest.more}>
            {t("activities.restMore")}
          </button>
          <button type="button" className="tally-pill" onClick={rest.skip}>
            {t("tally.skipRest")}
          </button>
        </span>
      )}
    </div>
  );
}
