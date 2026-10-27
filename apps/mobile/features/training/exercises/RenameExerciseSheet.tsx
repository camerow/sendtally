import React from "react";
import { View } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { Button } from "../components/Button";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { HangSheet } from "../data/HangSheet";
import { type } from "../type";

export type RenameExerciseSheetProps = {
  exercise: Exercise;
  onSave: (name: string) => void;
  onClose: () => void;
};

/** A new name for an exercise, which every workout and log using it takes. */
export function RenameExerciseSheet({
  exercise,
  onSave,
  onClose,
}: RenameExerciseSheetProps): React.ReactElement {
  const [name, setName] = React.useState(exercise.name);
  const trimmed = name.trim();
  const save = (): void => {
    if (trimmed === "") return;
    if (trimmed !== exercise.name) onSave(trimmed);
    onClose();
  };
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={exercise.name}
          title={t("workouts.renameExercise")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <SheetSection label={t("hang.name")}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={save}
            accessibilityLabel={t("hang.name")}
            returnKeyType="done"
            maxLength={80}
            autoFocus
            style={[
              type.bodyBold,
              {
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 16,
                color: colors.gunmetal,
                borderWidth: 1,
                borderColor: colors.lineOnLightStrong,
              },
            ]}
          />
        </SheetSection>
        <Button
          label={t("hang.saveChanges")}
          onPress={save}
          variant="primary"
          height={54}
          disabled={trimmed === ""}
        />
      </View>
    </HangSheet>
  );
}
