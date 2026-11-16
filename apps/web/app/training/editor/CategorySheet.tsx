import React from "react";
import { WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { CategoryMark } from "../components/CategoryMark";

export type CategorySheetProps = {
  /** The categories offered; all five by default. */
  kinds?: readonly WorkoutKind[];
  onPick: (kind: WorkoutKind) => void;
  onClose: () => void;
};

/** Making a new exercise where its category is not known yet: the category first, then its editor. */
export function CategorySheet({
  kinds = WORKOUT_KINDS,
  onPick,
  onClose,
}: CategorySheetProps): React.ReactElement {
  return (
    <Sheet open title={t("workouts.pickExerciseCategory")} onClose={onClose}>
      <span className="train-label">{t("workouts.createExercise")}</span>
      <div className="option-list">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            className="option-row option-row--mark"
            onClick={() => {
              onClose();
              onPick(k);
            }}
          >
            <CategoryMark kind={k} size={28} />
            {kindLabel(k)}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
