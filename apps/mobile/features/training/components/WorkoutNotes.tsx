import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useRunWorkout } from "../library/useLibrary";
import { type } from "../type";

export type WorkoutNotesProps = { workoutId: string };

/** What a workout says about itself while it runs: its description, then its target effort. */
export function WorkoutNotes({ workoutId }: WorkoutNotesProps): React.ReactElement | null {
  const workout = useRunWorkout(workoutId);
  if (workout === undefined) return null;
  return (
    <>
      {workout.description !== "" && (
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
          {workout.description}
        </Text>
      )}
      {workout.targetRpe !== null && (
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.targetValue", { n: workout.targetRpe })}
        </Text>
      )}
    </>
  );
}
