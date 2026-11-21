import React from "react";
import { Button } from "@sendtally/design";
import { useExerciseList } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { setPlanPath, usePlanPath, type PlanPath } from "@sendtally/features/settings";
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

const toggled = (p: PlanPath, id: string): PlanPath => {
  if (!p.workouts.includes(id)) return { ...p, workouts: [...p.workouts, id] };
  return {
    ...p,
    workouts: p.workouts.filter((w) => w !== id),
    days: Object.fromEntries(Object.entries(p.days).filter(([w]) => w !== id)),
  };
};

/** P3's dialog: the built-in workouts, each added to the week or taken back, or another of their own. */
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
  const toggle = (id: string): void => setPlanPath((p) => toggled(p, id));
  return (
    <Sheet
      open={open}
      kicker={t("onboarding.plan.yourPlan")}
      title={t("onboarding.plan.week.addWorkout")}
      onClose={onClose}
      action={{ label: t("common.done"), onPress: onClose }}
      cancel={false}
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
