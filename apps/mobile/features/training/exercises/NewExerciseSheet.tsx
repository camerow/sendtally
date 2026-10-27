import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, View } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { TextInput } from "../../../components/TextInput";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Segmented } from "../components/Segmented";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { EXERCISE_SHELVES } from "../train/ExerciseShelves";
import { type } from "../type";
import { takenBy } from "./takenBy";

type Kind = (typeof EXERCISE_SHELVES)[number];

export type NewExerciseSheetProps = { onClose: () => void };

const open = (exercise: Exercise): void =>
  router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } });

/** A new exercise by name and kind, opened once saved; a name already taken opens that one. */
export function NewExerciseSheet({ onClose }: NewExerciseSheetProps): React.ReactElement {
  const api = useApi();
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<Kind>("strength");
  const trimmed = name.trim();
  const save = (): void => {
    if (trimmed === "") return;
    onClose();
    void api.saveExercise(randomUUID(), { name: trimmed, kind }).then(
      ({ exercise }) => open(exercise),
      (error: unknown) => {
        const taken = takenBy(error);
        if (taken === undefined) Alert.alert(t("workouts.saveFailed"));
        else open(taken);
      }
    );
  };
  return (
    <Sheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 20, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("plan.tabExercises")}
          title={t("workouts.newExercise")}
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
        <SheetSection label={t("workouts.category")}>
          <Segmented<Kind>
            value={kind}
            onChange={setKind}
            options={EXERCISE_SHELVES.map((k) => ({ value: k, label: kindLabel(k) }))}
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
    </Sheet>
  );
}
