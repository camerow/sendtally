import React from "react";
import { View } from "react-native";
import { WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { PlanChoiceRow } from "../plan/PlanChoiceRow";
import { openEditor } from "./openEditor";

export type NewWorkoutSheetProps = { onClose: () => void };

/** New workout: what kind first, then its editor once the sheet has slid away. */
export function NewWorkoutSheet({ onClose }: NewWorkoutSheetProps): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const picked = React.useRef<WorkoutKind | null>(null);
  const pick = (kind: WorkoutKind): void => {
    picked.current = kind;
    setOpen(false);
  };
  return (
    <Sheet
      visible={open}
      onClose={() => {
        onClose();
        if (picked.current !== null) openEditor(picked.current);
      }}
      closeLabel={t("plan.close")}
    >
      <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 4 }}>
        <SheetHeader
          kicker={t("workouts.newWorkout")}
          title={t("workouts.pickCategory")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <SheetSection label={t("workouts.category")} gap={2}>
          {WORKOUT_KINDS.map((k) => (
            <PlanChoiceRow key={k} kind={k} title={kindLabel(k)} onPress={() => pick(k)} />
          ))}
        </SheetSection>
      </View>
    </Sheet>
  );
}
