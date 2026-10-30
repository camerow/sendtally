import React from "react";
import { View } from "react-native";
import { WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { PlanChoiceRow } from "../plan/PlanChoiceRow";

export type NewWorkoutSheetProps = {
  /** What is being made, a workout or an exercise. */
  making: "workout" | "exercise";
  /** The categories offered; all five by default. */
  kinds?: readonly WorkoutKind[];
  /** The category picked, once the sheet has slid away, for its editor to open. */
  onPick: (kind: WorkoutKind) => void;
  onClose: () => void;
};

/** Making something new where its category is not known yet: the category first, then its editor. */
export function NewWorkoutSheet({
  making,
  kinds = WORKOUT_KINDS,
  onPick,
  onClose,
}: NewWorkoutSheetProps): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const picked = React.useRef<WorkoutKind | null>(null);
  const pick = (kind: WorkoutKind): void => {
    picked.current = kind;
    setOpen(false);
  };
  const workout = making === "workout";
  return (
    <Sheet
      visible={open}
      onClose={() => {
        onClose();
        if (picked.current !== null) onPick(picked.current);
      }}
      closeLabel={t("plan.close")}
    >
      <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 4 }}>
        <SheetHeader
          kicker={workout ? t("workouts.newWorkout") : t("workouts.newExercise")}
          title={workout ? t("workouts.pickCategory") : t("workouts.pickExerciseCategory")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <SheetSection label={t("workouts.category")} gap={2}>
          {kinds.map((k) => (
            <PlanChoiceRow key={k} kind={k} title={kindLabel(k)} onPress={() => pick(k)} />
          ))}
        </SheetSection>
      </View>
    </Sheet>
  );
}
