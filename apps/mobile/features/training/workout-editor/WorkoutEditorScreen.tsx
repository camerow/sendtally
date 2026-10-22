import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  copyName,
  draftOf,
  newWorkoutDraft,
  useWorkoutActions,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { LoadState } from "../data/LoadState";
import { BodyPreview } from "../library-detail/BodyPreview";
import { useLibrary } from "../library/useLibrary";
import { MinutesField } from "../plan/MinutesField";
import { TargetEffort } from "../plan/TargetEffort";
import { type } from "../type";
import { EditorTextField } from "./EditorTextField";
import { draftOfEditor, editorStateOf } from "./editorState";
import type { WorkoutEditorState } from "./types";
import { useHangData } from "../data/HangDataContext";

export type WorkoutEditorScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this kind. */
  kind?: WorkoutKind;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function initialState(
  library: WorkoutLibrary,
  { id, from, kind }: WorkoutEditorScreenProps
): WorkoutEditorState | null {
  const base = library.workout(id ?? from ?? "");
  const draft = base === undefined ? null : draftOf(base);
  if (draft !== null)
    return editorStateOf(id === undefined ? { ...draft, name: copyName(draft.name) } : draft);
  return kind === undefined ? null : editorStateOf(newWorkoutDraft(kind));
}

function Editor({
  id,
  initial,
}: {
  id: string | undefined;
  initial: WorkoutEditorState;
}): React.ReactElement {
  const actions = useWorkoutActions(useApi(), reportFailure);
  const { model } = useHangData();
  const [state, setState] = React.useState(initial);
  const update = (patch: Partial<WorkoutEditorState>): void =>
    setState((s) => ({ ...s, ...patch }));

  const save = (): void => {
    const workoutId = id ?? randomUUID();
    void actions.saveWorkout(workoutId, draftOfEditor(state));
    if (id !== undefined) router.back();
    else router.replace({ pathname: "/workout/[id]", params: { id: workoutId } });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 6,
        }}
      >
        <Button label={t("hang.cancel")} onPress={() => router.back()} variant="link" height={44} />
        <Label color={colors.textSecondary}>
          {`${kindLabel(state.kind)} · ${id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}`}
        </Label>
        <Button label={t("hang.save")} onPress={save} variant="primary" height={44} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 20,
            paddingTop: 8,
            paddingHorizontal: 18,
            paddingBottom: 28,
          }}
        >
          <View style={{ gap: 6 }}>
            <Label small color={colors.textSecondary}>
              {t("hang.name")}
            </Label>
            <TextInput
              value={state.name}
              onChangeText={(name) => update({ name })}
              placeholder={t("workouts.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t("hang.name")}
              maxLength={80}
              style={[
                type.display,
                {
                  height: 52,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  fontSize: 22,
                  color: colors.gunmetal,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                },
              ]}
            />
          </View>
          <EditorTextField
            label={t("workouts.description")}
            value={state.description}
            placeholder={t("workouts.descriptionPlaceholder")}
            maxLength={2000}
            multiline
            onChange={(description) => update({ description })}
          />
          <MinutesField value={state.minutes} onChange={(minutes) => update({ minutes })} />
          <TargetEffort value={state.targetRpe} onChange={(targetRpe) => update({ targetRpe })} />
          <BodyPreview
            workout={{ ...state, id: id ?? "", source: "mine" }}
            unit={model.settings.units}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Make, edit or customise a workout other than a hangboard one, which has its own builder.
 * What it holds shows read only.
 */
export function WorkoutEditorScreen(props: WorkoutEditorScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const initial = initialState(state.data, props);
  return initial === null ? null : <Editor id={props.id} initial={initial} />;
}
