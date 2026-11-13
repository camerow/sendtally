import React from "react";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { climbingDoseLine } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { exerciseName, type ClimbingItem } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";

export type ClimbingCardProps = ClimbingItem & { item: SessionItem; onStart: () => void };

/** A climbing exercise in the player: its dose and last time, and Start to log it on the tally. */
export function ClimbingCard({
  item,
  measure,
  lastTime,
  logged,
  live,
  onStart,
}: ClimbingCardProps): React.ReactElement {
  const rest = item.dose.setRestS ?? 0;
  const line = logged ?? lastTime;
  return (
    <section className="player-card">
      <div className="player-card-head">
        <h2 className="player-card-name">{exerciseName(item.exercise)}</h2>
        {rest > 0 && (
          <span className="player-card-meta">{t("plan.chipRest", { value: clock(rest) })}</span>
        )}
      </div>
      <span className="player-dose">{climbingDoseLine(item.dose, measure)}</span>
      {line !== null && <span className="player-last">{line}</span>}
      <button type="button" className="detail-primary player-start" onClick={onStart}>
        <Icon name="play" size={16} strokeWidth={2.2} />
        {live ? t("activities.resume") : t("hang.start")}
      </button>
    </section>
  );
}
