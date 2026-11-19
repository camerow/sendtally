import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { protocolDose, type HangSetup, type HangWorkout, type Dose } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { hangLoadText } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { targetText } from "@sendtally/features/workouts";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExerciseHead } from "./ExerciseHead";

export type FingersGripProps = {
  workout: HangWorkout;
  dose: Dose | undefined;
  /** The setup the timer runs it on, once it has; the one it would start from otherwise. */
  setup: HangSetup | undefined;
};

/** One grip of a mix's fingerboard part before its timer ends: its target, then its edge and load. */
export function FingersGrip({ workout, dose, setup }: FingersGripProps): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const { edgeMm, loadKg } = setup ?? model.setup(workout, workout.grip, dose);
  const line = [
    workout.kind === "hang" ? t("hang.edgeMm", { n: edgeMm }) : null,
    loadKg === 0 && workout.kind === "hang" ? null : hangLoadText(loadKg, unit),
  ]
    .filter((x) => x !== null)
    .join(" · ");
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={model.gripName(workout.grip)}
          target={targetText(dose ?? protocolDose(workout), "hangboard", unit)}
          onHistory={() => router.push({ pathname: "/grip/[id]", params: { id: workout.grip } })}
        />
      }
    >
      <Text
        style={[type.mono, { marginTop: -6, fontSize: 14, lineHeight: 20, color: colors.gunmetal }]}
      >
        {line}
      </Text>
    </ExerciseBlock>
  );
}
