import React from "react";
import { Button } from "@sendtally/design";
import { useExerciseList } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { pickToggled, setPlanPath, usePlanPath } from "@sendtally/features/settings";
import { libraryLine } from "@sendtally/features/workouts";
import { Sheet } from "../../../components/Sheet";
import { useAppApi } from "../../../lib/useAppApi";
import { useHangData } from "../../../training/data/HangDataContext";
import { useLibrary } from "../../../training/library/useLibrary";
import { AddWorkoutRow } from "../../../training/plan-week/AddWorkoutRow";

export type AddWorkoutSheetProps = {
  open: boolean;
  onClose: () => void;
  onBuildAnother: () => void;
};

/** All workouts, from Build your week: the built-in workouts, each picked or taken back, or one of their own. */
export function AddWorkoutSheet({
  open,
  onClose,
  onBuildAnother,
}: AddWorkoutSheetProps): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useAppApi());
  const { state } = useLibrary();
  const path = usePlanPath();
  const builtIns =
    state.status === "ready" ? state.data.workouts.filter((w) => w.source === "library") : [];
  const toggle = (id: string): void => setPlanPath((p) => pickToggled(p, id));
  return (
    <Sheet
      open={open}
      kicker={t("onboarding.plan.yourPlan")}
      title={t("onboarding.plan.week.addWorkout")}
      onClose={onClose}
      headAction={{ label: t("common.done"), onPress: onClose }}
    >
      <span className="train-label">{t("workouts.fromLibrary")}</span>
      <div className="plan-path-rows">
        {builtIns.map((w) => (
          <AddWorkoutRow
            key={w.id}
            kind={w.kind}
            name={w.name}
            meta={libraryLine(w, model.settings.units, exercises)}
            picture={libraryPictures("workout", w.id)[0]}
            state={path.workouts.includes(w.id) ? "added" : "none"}
            thereLabel=""
            onOpen={() => toggle(w.id)}
            onAdd={() => toggle(w.id)}
            onUndo={() => toggle(w.id)}
          />
        ))}
      </div>
      <div>
        <Button
          variant="ghostOnLight"
          onClick={() => {
            onClose();
            onBuildAnother();
          }}
        >
          + {t("onboarding.plan.week.buildAnother")}
        </Button>
      </div>
    </Sheet>
  );
}
