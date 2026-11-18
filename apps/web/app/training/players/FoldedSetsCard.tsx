import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

export type FoldedSetsCardProps = {
  name: string;
  /** What it did, "5 × 5 · 135 lb", or that it was skipped. */
  line: string;
  /** Every set ticked: a tick in place of the chevron. */
  done: boolean;
  onOpen: () => void;
};

/** An exercise folded to one line: done with a tick, skipped, or folded from its title; a click opens it. */
export function FoldedSetsCard({
  name,
  line,
  done,
  onOpen,
}: FoldedSetsCardProps): React.ReactElement {
  return (
    <button
      type="button"
      className="player-card player-card--folded"
      aria-label={`${t("workouts.openExercise", { name })}, ${line}`}
      aria-expanded="false"
      onClick={onOpen}
    >
      <span className="player-card-text">
        <span className="player-card-name">{name}</span>
        <span className="player-card-meta">{line}</span>
      </span>
      {done ? (
        <span className="player-check">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
      ) : (
        <span className="player-chevron player-chevron--down">
          <Icon name="chevron" size={16} strokeWidth={2} />
        </span>
      )}
    </button>
  );
}
