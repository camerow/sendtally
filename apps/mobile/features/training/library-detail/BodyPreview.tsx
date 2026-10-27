import React from "react";
import { View } from "react-native";
import { intervalsOf, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { variationName } from "@sendtally/features/training";
import {
  bodySummary,
  doseSummary,
  exerciseName,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { IntervalsBar } from "../components/IntervalsBar";
import { Label } from "../components/Label";
import { PreviewRow } from "./PreviewRow";

export type BodyPreviewProps = {
  workout: LibraryWorkout;
  unit: WeightUnit;
  /** Where tapping an item goes: its exercise, when it has a screen. */
  openExercise?: (name: string) => (() => void) | undefined;
};

/** What the workout holds, read only: each variation's items and what each asks for. */
export function BodyPreview({ workout, unit, openExercise }: BodyPreviewProps): React.ReactElement {
  const summary = bodySummary(workout);
  if (summary === null) return <DashedPanel body={t("workouts.noBody")} />;
  const rotates = workout.variations.length > 1;
  return (
    <View style={{ gap: 4 }}>
      {workout.variations.map((v, i) => {
        const timed = v.items.length > 0 && v.items.every((item) => item.dose.onS !== undefined);
        return (
          <View key={i} style={{ gap: 4 }}>
            <Label color={colors.gunmetal}>{rotates ? variationName(v.label, i) : summary}</Label>
            {timed && workout.kind !== "hangboard" && (
              <View style={{ flexDirection: "row", paddingVertical: 8 }}>
                <IntervalsBar intervals={intervalsOf(v.items)} height={14} />
              </View>
            )}
            {v.items.map((item, j) => (
              <PreviewRow
                key={j}
                title={exerciseName(item.exercise)}
                detail={doseSummary(workout.kind, item.dose, unit)}
                onPress={openExercise?.(item.exercise)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
