import React from "react";
import { View } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { OptionRow } from "../../../components/OptionRow";
import { SheetHeader } from "../components/SheetHeader";
import { HangSheet } from "../data/HangSheet";

export type MergeExerciseSheetProps = {
  exercise: Exercise;
  others: readonly Exercise[];
  onPick: (into: Exercise) => void;
  onClose: () => void;
};

/** The exercise to fold this one into: its own kind first. */
export function MergeExerciseSheet({
  exercise,
  others,
  onPick,
  onClose,
}: MergeExerciseSheetProps): React.ReactElement {
  const sorted = [...others].sort(
    (a, b) => Number(b.kind === exercise.kind) - Number(a.kind === exercise.kind)
  );
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <SheetHeader
          kicker={exercise.name}
          title={t("workouts.mergeExercise")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        {sorted.map((e) => (
          <OptionRow
            key={e.id}
            label={e.name}
            selected={false}
            mono={false}
            onPress={() => {
              onClose();
              onPick(e);
            }}
          />
        ))}
      </View>
    </HangSheet>
  );
}
