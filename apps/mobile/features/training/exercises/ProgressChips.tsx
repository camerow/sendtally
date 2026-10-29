import React from "react";
import { EXERCISE_PROGRESS, type ExerciseProgress } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { ChipRow } from "../components/ChipRow";
import { SheetSection } from "../components/SheetSection";

export type ProgressChipsProps = {
  value: ExerciseProgress | null;
  onChange: (progress: ExerciseProgress) => void;
};

/** What a climbing exercise's trend follows; unset reads as the climbs completed. */
export function ProgressChips({ value, onChange }: ProgressChipsProps): React.ReactElement {
  return (
    <SheetSection label={t("workouts.progress")}>
      <ChipRow<ExerciseProgress>
        value={value ?? "completed"}
        onChange={onChange}
        options={EXERCISE_PROGRESS.map((p) => ({ value: p, label: t(`workouts.progress.${p}`) }))}
      />
    </SheetSection>
  );
}
