import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, View } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { EXERCISE_KINDS, WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { findGrip } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { ChipRow } from "../components/ChipRow";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { KIND_COLORS } from "../insights/kindColors";
import { type } from "../type";
import { takenBy } from "./takenBy";

export type NewExerciseSheetProps = {
  /** The category it starts in. */
  kind?: WorkoutKind;
  onClose: () => void;
};

const open = (exercise: Exercise): void =>
  router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } });

/** A new exercise in any category, opened once saved; Fingers makes a grip, and a name already taken opens that one. */
export function NewExerciseSheet({
  kind: initialKind = "strength",
  onClose,
}: NewExerciseSheetProps): React.ReactElement {
  const api = useApi();
  const { model, actions } = useHangData();
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<WorkoutKind>(initialKind);
  const trimmed = name.trim();
  const save = (): void => {
    if (trimmed === "") return;
    onClose();
    const exerciseKind = EXERCISE_KINDS.find((k) => k === kind);
    if (exerciseKind === undefined) {
      const existing = findGrip(model.grips, trimmed);
      if (existing === undefined)
        void actions.saveGrip({ id: randomUUID(), name: trimmed, custom: true, hidden: false });
      else if (existing.hidden) void actions.saveGrip({ ...existing, hidden: false });
      return;
    }
    void api.saveExercise(randomUUID(), { name: trimmed, kind: exerciseKind }).then(
      ({ exercise }) => open(exercise),
      (error: unknown) => {
        const taken = takenBy(error);
        if (taken === undefined) Alert.alert(t("workouts.saveFailed"));
        else open(taken);
      }
    );
  };
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("plan.tabExercises")}
          title={t("workouts.newExercise")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <SheetSection label={t("workouts.category")}>
          <ChipRow<WorkoutKind>
            value={kind}
            onChange={setKind}
            options={WORKOUT_KINDS.map((k) => ({
              value: k,
              label: kindLabel(k),
              mark: KIND_COLORS[k],
            }))}
          />
        </SheetSection>
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
          label={t("hang.save")}
          onPress={save}
          variant="primary"
          height={54}
          disabled={trimmed === ""}
        />
      </View>
    </HangSheet>
  );
}
