import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useExerciseList } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { libraryLine } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { SheetHeader } from "../../training/components/SheetHeader";
import { HangSheet } from "../../training/data/HangSheet";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import { AddWorkoutRow } from "../../training/planning/AddWorkoutRow";
import { setPlanPath, usePlanPath, type PlanPath } from "@sendtally/features/settings";

export type AddWorkoutSheetProps = {
  visible: boolean;
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

/** P3's sheet: the built-in workouts, each added to the week or taken back, or another of their own. */
export function AddWorkoutSheet({
  visible,
  onClose,
  onBuildAnother,
}: AddWorkoutSheetProps): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useApi());
  const { state } = useLibrary();
  const path = usePlanPath();
  const builtIns =
    state.status === "ready" ? state.data.workouts.filter((w) => w.source === "library") : [];
  const toggle = (id: string): void => setPlanPath((p) => toggled(p, id));
  return (
    <HangSheet visible={visible} onClose={onClose} closeLabel={t("common.done")}>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("onboarding.plan.yourPlan")}
          title={t("onboarding.plan.week.addWorkout")}
          action={t("common.done")}
          onAction={onClose}
        />
        <View style={{ gap: 2 }}>
          <Label color={colors.textSecondary}>{t("workouts.fromLibrary")}</Label>
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
              onToggle={() => toggle(w.id)}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row" }}>
          <Button
            variant="outline"
            icon="plus"
            height={48}
            label={t("onboarding.plan.week.buildAnother")}
            onPress={() => {
              onClose();
              onBuildAnother();
            }}
          />
        </View>
      </View>
    </HangSheet>
  );
}
