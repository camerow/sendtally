import React from "react";
import { Text, View } from "react-native";
import { clamp, clock, parseSeconds } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { DoseTile } from "./DoseTile";

export type HangboardTimingProps = {
  exerciseRestS: number;
  /** Counted from the items; null with none. */
  minutes: number | null;
  onExerciseRest: (seconds: number) => void;
};

/** The rest between exercises, and the total time the workout takes with it. */
export function HangboardTiming({
  exerciseRestS,
  minutes,
  onExerciseRest,
}: HangboardTimingProps): React.ReactElement {
  return (
    <SheetSection
      label={t("workouts.totalTime")}
      aside={
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {minutes === null ? "–" : durationLabel(minutes)}
        </Text>
      }
    >
      <View style={{ flexDirection: "row" }}>
        <DoseTile
          label={t("workouts.exerciseRest")}
          value={clock(exerciseRestS)}
          keyboard="numbers-and-punctuation"
          onCommit={(text) => {
            const seconds = text.trim() === "" ? 0 : parseSeconds(text, "s");
            if (seconds !== null) onExerciseRest(clamp(Math.round(seconds), 0, 3600));
          }}
        />
      </View>
    </SheetSection>
  );
}
