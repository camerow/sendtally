import React from "react";
import { defaultMeasure, type WorkoutKind } from "@sendtally/core/hang";
import { exerciseKindOf, type ExerciseForm } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { ExerciseFields } from "./ExerciseFields";

/** A new exercise's form as it starts in a category, named from what was searched. */
export const newExerciseForm = (kind: WorkoutKind, name = ""): ExerciseForm => ({
  kind,
  name,
  measure: kind === "hangboard" ? "hang" : defaultMeasure(exerciseKindOf(kind) ?? "other"),
  eachSide: false,
});

/** A new exercise made from the picker, in a dialog so the workout being edited stays as it is. */
export function NewExerciseSheet({
  kind,
  name,
  onSave,
  onClose,
}: {
  kind: WorkoutKind;
  name: string;
  onSave: (form: ExerciseForm) => void;
  onClose: () => void;
}): React.ReactElement {
  const [form, setForm] = React.useState(() => newExerciseForm(kind, name));
  const trimmed = form.name.trim();
  const save = (): void => {
    if (trimmed !== "") onSave({ ...form, name: trimmed });
  };
  return (
    <Sheet
      open
      title={t("workouts.newExercise")}
      onClose={onClose}
      action={{ label: t("common.save"), onPress: save, disabled: trimmed === "" }}
    >
      <div className="sheet-form">
        <ExerciseFields form={form} onChange={setForm} autoFocus onSubmit={save} />
      </div>
    </Sheet>
  );
}
