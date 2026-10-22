import React from "react";
import { View } from "react-native";
import type { ActivityKind, PlanTemplate } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { newExercise, useExerciseNames, type SetsDetail } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { ExerciseCard } from "./ExerciseCard";

export type SetsEditorProps = {
  value: SetsDetail;
  kind: ActivityKind;
  targets: PlanTemplate | null;
  unit: WeightUnit;
  template: boolean;
  inSheet: boolean;
  onChange: (value: SetsDetail) => void;
};

/** Exercise cards, each with its set table, and a way to add another. */
export function SetsEditor({
  value,
  kind,
  targets,
  unit,
  template,
  inSheet,
  onChange,
}: SetsEditorProps): React.ReactElement {
  const names = useExerciseNames(useApi());
  const { exercises } = value;
  return (
    <View style={{ gap: 12 }}>
      {exercises.map((exercise, i) => (
        <ExerciseCard
          key={i}
          exercise={exercise}
          names={names}
          targets={targets}
          unit={unit}
          template={template}
          inSheet={inSheet}
          onChange={(next) =>
            onChange({ ...value, exercises: exercises.map((e, j) => (j === i ? next : e)) })
          }
          onRemove={() => onChange({ ...value, exercises: exercises.filter((_, j) => j !== i) })}
        />
      ))}
      <Button
        label={t("activities.addExercise")}
        icon="plus"
        variant="dashed"
        disabled={exercises.length >= 30}
        onPress={() => onChange({ ...value, exercises: [...exercises, newExercise(kind)] })}
      />
    </View>
  );
}
