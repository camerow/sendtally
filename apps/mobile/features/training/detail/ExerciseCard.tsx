import React from "react";
import { Text, View } from "react-native";
import type { PlanTemplate } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import {
  measureLabel,
  nextSet,
  setTargetFor,
  toggleMeasure,
  type Exercise,
  type SetTarget,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { ExerciseNameField } from "./ExerciseNameField";
import { MeasureChips } from "./MeasureChips";
import { SetRow } from "./SetRow";

export type ExerciseCardProps = {
  exercise: Exercise;
  names: readonly string[];
  targets: PlanTemplate | null;
  unit: WeightUnit;
  template: boolean;
  inSheet: boolean;
  onChange: (exercise: Exercise) => void;
  onRemove: () => void;
};

const header = [type.labelSmall, { color: colors.textSecondary }];

/** One exercise: its name, what its sets measure, and the set table. */
export function ExerciseCard({
  exercise,
  names,
  targets,
  unit,
  template,
  inSheet,
  onChange,
  onRemove,
}: ExerciseCardProps): React.ReactElement {
  const { sets, measures } = exercise;
  const targetOf = (i: number): SetTarget | null =>
    template ? null : setTargetFor(targets, exercise.name, i);
  const showTarget = sets.some((_, i) => targetOf(i) !== null);
  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        borderRadius: radius.cardLg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
        <View style={{ flex: 1 }}>
          <ExerciseNameField
            value={exercise.name}
            names={names}
            inSheet={inSheet}
            onChange={(name) => onChange({ ...exercise, name })}
          />
        </View>
        <IconButton
          icon="x"
          label={t("activities.removeExercise")}
          onPress={onRemove}
          color={colors.textSecondary}
        />
      </View>
      <MeasureChips value={measures} onToggle={(m) => onChange(toggleMeasure(exercise, m))} />
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[header, { width: 24 }]}>{t("activities.set")}</Text>
          {showTarget && <Text style={[header, { flex: 1.2 }]}>{t("activities.target")}</Text>}
          {measures.map((m) => (
            <Text key={m} numberOfLines={1} style={[header, { flex: 1, textAlign: "center" }]}>
              {measureLabel(m)}
            </Text>
          ))}
          {!template && (
            <Text style={[header, { width: 44, textAlign: "center" }]}>{t("common.done")}</Text>
          )}
        </View>
        {sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            measures={measures}
            target={showTarget ? targetOf(i) : undefined}
            unit={unit}
            template={template}
            inSheet={inSheet}
            onChange={(next) =>
              onChange({ ...exercise, sets: sets.map((s, j) => (j === i ? next : s)) })
            }
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label={t("activities.addSet")}
          icon="plus"
          variant="outline"
          height={44}
          style={{ flex: 1 }}
          disabled={sets.length >= 50}
          onPress={() => onChange({ ...exercise, sets: [...sets, nextSet(sets)] })}
        />
        <Button
          label={t("activities.removeSet")}
          variant="link"
          height={44}
          disabled={sets.length === 0}
          onPress={() => onChange({ ...exercise, sets: sets.slice(0, -1) })}
        />
      </View>
    </View>
  );
}
