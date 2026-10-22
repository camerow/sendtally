import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PlanKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  categoryLabel,
  copyName,
  draftOf,
  newWorkoutDraft,
  useWorkoutActions,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { DetailSection } from "../detail/DetailSection";
import { useLibrary } from "../library/useLibrary";
import { MinutesField } from "../plan/MinutesField";
import { ProjectChoice } from "../plan/ProjectChoice";
import { TargetEffort } from "../plan/TargetEffort";
import { type } from "../type";
import { EditorTextField } from "./EditorTextField";
import { draftOfEditor, editorStateOf } from "./editorState";
import { FocusChoice } from "./FocusChoice";
import type { WorkoutEditorState } from "./types";

export type WorkoutEditorScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this category. */
  category?: PlanKind;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function initialState(
  library: WorkoutLibrary,
  { id, from, category }: WorkoutEditorScreenProps
): WorkoutEditorState | null {
  const base = library.workout(id ?? from ?? "");
  const draft = base === undefined ? null : draftOf(base);
  if (draft !== null)
    return editorStateOf(id === undefined ? { ...draft, name: copyName(draft.name) } : draft);
  return category === undefined ? null : editorStateOf(newWorkoutDraft(category));
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
  const { category } = state;

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
          {`${categoryLabel(category)} · ${id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}`}
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
          <EditorTextField
            label={t("workouts.tags")}
            value={state.tags}
            placeholder={t("workouts.tagsPlaceholder")}
            maxLength={200}
            onChange={(tags) => update({ tags })}
          />
          <MinutesField value={state.minutes} onChange={(minutes) => update({ minutes })} />
          <TargetEffort value={state.targetRpe} onChange={(targetRpe) => update({ targetRpe })} />
          {category === "climb" ? (
            <>
              <FocusChoice value={state.focus} onChange={(focus) => update({ focus })} />
              {state.focus === "project" && (
                <ProjectChoice
                  value={state.projectId}
                  onChange={(projectId) => update({ projectId })}
                />
              )}
            </>
          ) : (
            <DetailSection
              value={state.detail}
              kind={category}
              unit={model.settings.units}
              targets={null}
              template
              inSheet={false}
              onChange={(detail) => update({ detail })}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Make, edit or customise a workout other than a hangboard one, which has its own builder. */
export function WorkoutEditorScreen(props: WorkoutEditorScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const initial = initialState(state.data, props);
  return initial === null ? null : <Editor id={props.id} initial={initial} />;
}
