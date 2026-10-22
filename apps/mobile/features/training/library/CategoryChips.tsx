import React from "react";
import { ScrollView } from "react-native";
import { t } from "@sendtally/features/i18n";
import { categoryLabel, type WorkoutCategory } from "@sendtally/features/workouts";
import { Chip } from "../../../components/Chip";

export type CategoryChipsProps = {
  offered: readonly WorkoutCategory[];
  /** Empty is All. */
  value: readonly WorkoutCategory[];
  onChange: (value: WorkoutCategory[]) => void;
};

/** All, or any mix of categories. */
export function CategoryChips({
  offered,
  value,
  onChange,
}: CategoryChipsProps): React.ReactElement {
  const toggle = (c: WorkoutCategory): void =>
    onChange(value.includes(c) ? value.filter((v) => v !== c) : [...value, c]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8 }}
    >
      <Chip label={t("workouts.all")} active={value.length === 0} onPress={() => onChange([])} />
      {offered.map((c) => (
        <Chip
          key={c}
          label={categoryLabel(c)}
          active={value.includes(c)}
          onPress={() => toggle(c)}
        />
      ))}
    </ScrollView>
  );
}
