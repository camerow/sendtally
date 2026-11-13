import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useRunWorkout } from "../library/useLibrary";
import { type } from "../type";
import { ON_DARK_SOFT } from "@sendtally/features/workouts";

export type WorkoutNotesProps = {
  workoutId: string;
  /** On the dark timer, in softer ink. */
  dark?: boolean;
};

/** A running workout's target effort. */
export function WorkoutNotes({
  workoutId,
  dark = false,
}: WorkoutNotesProps): React.ReactElement | null {
  const workout = useRunWorkout(workoutId);
  if (workout === undefined) return null;
  const ink = dark ? ON_DARK_SOFT : colors.textSecondary;
  return (
    <>
      {workout.targetRpe !== null && (
        <Text style={[type.mono, { fontSize: 12, color: ink }, dark && { textAlign: "center" }]}>
          {t("plan.targetValue", { n: workout.targetRpe })}
        </Text>
      )}
    </>
  );
}
