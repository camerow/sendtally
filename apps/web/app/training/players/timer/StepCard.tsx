import React from "react";
import type { StepText } from "@sendtally/features/activities";

export type StepCardProps = {
  text: StepText;
  color: string;
  ariaLabel: string;
  onPress: () => void;
};

/** The step playing now, big: its kind and side, name, countdown or count, and cue. Pressing it is the primary action. */
export function StepCard({ text, color, ariaLabel, onPress }: StepCardProps): React.ReactElement {
  return (
    <button type="button" className="timer-step" aria-label={ariaLabel} onClick={onPress}>
      <span className="timer-label" style={{ color }}>
        {text.kicker}
      </span>
      <span className="timer-step-title">{text.title}</span>
      <span className="timer-step-count">
        <span className="timer-step-big">{text.big}</span>
        {text.of !== null && <span className="timer-step-of">{text.of}</span>}
      </span>
      {text.note !== null && <span className="timer-step-note">{text.note}</span>}
    </button>
  );
}
