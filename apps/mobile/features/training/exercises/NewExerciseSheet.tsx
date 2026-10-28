import { router } from "expo-router";
import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { ExerciseSheet } from "./ExerciseSheet";
import { useMakeExercise } from "./useMakeExercise";

export type NewExerciseSheetProps = {
  /** The category it starts in. */
  kind?: WorkoutKind;
  onClose: () => void;
};

/** New exercise from Train: opened once saved, or the one already holding its name. */
export function NewExerciseSheet({
  kind = "strength",
  onClose,
}: NewExerciseSheetProps): React.ReactElement {
  const make = useMakeExercise();
  return (
    <ExerciseSheet
      initial={{ kind, name: "" }}
      onClose={onClose}
      onSave={(form) =>
        void make(form).then((made) => {
          if (made !== null && "exercise" in made)
            router.push({ pathname: "/exercise/[id]", params: { id: made.exercise.id } });
        })
      }
    />
  );
}
