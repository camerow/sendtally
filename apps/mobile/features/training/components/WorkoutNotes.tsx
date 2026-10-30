import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useRunWorkout } from "../library/useLibrary";
import { type } from "../type";
import { ON_DARK_SOFT } from "./onDark";

export type WorkoutNotesProps = {
  workoutId: string;
  /** On the dark timer: softer ink, and a long description cut to two lines. */
  dark?: boolean;
};

/** What a workout says about itself while it runs: its description, then its target effort. */
export function WorkoutNotes({
  workoutId,
  dark = false,
}: WorkoutNotesProps): React.ReactElement | null {
  const workout = useRunWorkout(workoutId);
  if (workout === undefined) return null;
  const ink = dark ? ON_DARK_SOFT : colors.textSecondary;
  return (
    <>
      {workout.description !== "" && (
        <Text
          numberOfLines={dark ? 2 : undefined}
          style={[
            type.body,
            { fontSize: dark ? 14 : 15, lineHeight: dark ? 20 : 22, color: ink },
            dark && { textAlign: "center" },
          ]}
        >
          {workout.description}
        </Text>
      )}
      {workout.targetRpe !== null && (
        <Text style={[type.mono, { fontSize: 12, color: ink }, dark && { textAlign: "center" }]}>
          {t("plan.targetValue", { n: workout.targetRpe })}
        </Text>
      )}
    </>
  );
}
