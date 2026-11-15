import React from "react";
import { t } from "@sendtally/features/i18n";

export type ExtraSetsProps = {
  exercise: string;
  sets: number;
  max: number;
  canAdd: boolean;
  onAdd: () => void;
};

/** Under a set range's sets: one more to add once those are done, or how many of its top it reached. */
export function ExtraSets({
  exercise,
  sets,
  max,
  canAdd,
  onAdd,
}: ExtraSetsProps): React.ReactElement | null {
  if (canAdd)
    return (
      <button
        type="button"
        className="outline-button player-add-set"
        aria-label={t("activities.addSetTo", { exercise })}
        onClick={onAdd}
      >
        + {t("activities.addSetUpTo", { n: max })}
      </button>
    );
  if (sets < max) return null;
  return (
    <p className="player-card-meta player-sets-of-max">
      {t("activities.setsOfMax", { n: sets, max })}
    </p>
  );
}
