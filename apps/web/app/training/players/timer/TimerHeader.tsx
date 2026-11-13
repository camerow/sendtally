import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { useGoBack } from "../../../lib/useGoBack";
import { WorkoutInfo } from "../WorkoutInfo";

export type TimerHeaderProps = {
  name: string;
  meta: string;
  /** Its description behind an info button beside the name. */
  workoutId: string | null;
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

/** Minimise, which leaves the run going on the live bar, the workout, mute, and End. */
export function TimerHeader({
  name,
  meta,
  workoutId,
  muted,
  onEnd,
  onToggleMute,
}: TimerHeaderProps): React.ReactElement {
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
      <div className="timer-head-title">
        <span className="timer-head-name-row">
          <span className="timer-head-name">{name}</span>
          {workoutId !== null && <WorkoutInfo workoutId={workoutId} dark />}
        </span>
        <span className="timer-label timer-head-meta">{meta}</span>
      </div>
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
