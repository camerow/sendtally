import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

export type FoldedSetsCardProps = { name: string; sets: number; onOpen: () => void };

/** An exercise with every set ticked, folded to one line; clicking opens its sets again. */
export function FoldedSetsCard({ name, sets, onOpen }: FoldedSetsCardProps): React.ReactElement {
  const done = t("activities.setsDoneOf", { done: sets, count: sets });
  return (
    <button
      type="button"
      className="player-card player-card--folded"
      aria-label={`${name}, ${done}`}
      onClick={onOpen}
    >
      <span className="player-card-name">{name}</span>
      <span className="player-card-meta">{done}</span>
      <span className="player-check">
        <Icon name="check" size={14} strokeWidth={2.6} />
      </span>
    </button>
  );
}
