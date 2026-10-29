import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Focus, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { exerciseLabel } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  copyName,
  draftOf,
  newWorkoutDraft,
  useWorkoutActions,
  workoutMinutes,
  type WorkoutDraft,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EditorHeader } from "../components/EditorHeader";
import { FocusField } from "../components/FocusField";
import { KindNameField } from "../components/KindNameField";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { ExercisePickerSheet } from "../exercise-picker/ExercisePickerSheet";
import { useLibrary } from "../library/useLibrary";
import { TargetEffort } from "../plan/TargetEffort";
import { EditorTextField } from "./EditorTextField";
import { HangboardTiming } from "./HangboardTiming";
import {
  draftOfEditor,
  startingDraft,
  withExerciseSwapped,
  withItem,
  withItemsAdded,
  withoutItem,
} from "./editorState";
import { doseMeasureOf } from "./doseFields";
import { ItemEditor } from "./ItemEditor";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { TimeField } from "../../../components/TimeField";

const MAX_MINUTES = 600;

/** None at zero, else the whole minutes typed. */
const usualMinutes = (seconds: number): number | null =>
  seconds === 0 ? null : Math.min(MAX_MINUTES, Math.max(1, Math.round(seconds / 60)));

export type WorkoutEditorScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this kind. */
  kind?: WorkoutKind;
  /** A new workout's focus, from the shelf it was made on; General by default. */
  focus?: Focus | null;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function initialDraft(
  library: WorkoutLibrary,
  { id, from, kind, focus = null }: WorkoutEditorScreenProps
): WorkoutDraft | null {
  const base = library.workout(id ?? from ?? "");
  if (base !== undefined) {
    const draft = draftOf(base);
    return id === undefined ? { ...draft, name: copyName(draft.name) } : draft;
  }
  return kind === undefined ? null : startingDraft({ ...newWorkoutDraft(kind), focus });
}

function Editor({
  id,
  initial,
}: {
  id: string | undefined;
  initial: WorkoutDraft;
}): React.ReactElement {
  const api = useApi();
  const actions = useWorkoutActions(api, reportFailure);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  const [state, setState] = React.useState(initial);
  const [untouched] = React.useState(initial);
  const [picking, setPicking] = React.useState<{ swap: number } | "add" | null>(null);
  const exerciseNamed = (name: string) =>
    exercises.status === "ready"
      ? exercises.data.find((e) => exerciseKey(e.name) === exerciseKey(name))
      : undefined;
  const nameOf = (exercise: string): string => {
    if (state.kind === "hangboard") return model.gripName(exercise);
    const own = exerciseNamed(exercise);
    return own === undefined ? exercise : exerciseLabel(own);
  };

  const save = (): void => {
    void actions.saveWorkout(id ?? randomUUID(), draftOfEditor(state));
    router.back();
  };

  const cancel = (): void => {
    if (state === untouched) router.back();
    else
      confirmDestructive({
        title: t("workouts.discardChangesTitle"),
        action: t("common.discard"),
        onConfirm: () => router.back(),
      });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <EditorHeader
        title={id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}
        onCancel={cancel}
        onSave={save}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <KeypadScrollView
          contentContainerStyle={{
            gap: 18,
            paddingTop: 6,
            paddingHorizontal: 18,
            paddingBottom: 28,
          }}
        >
          <KindNameField
            kind={state.kind}
            value={state.name}
            onChange={(name) => setState((s) => ({ ...s, name }))}
            placeholder={t("workouts.namePlaceholder")}
            maxLength={80}
          />
          <EditorTextField
            label={t("workouts.description")}
            value={state.description}
            placeholder={t("workouts.descriptionPlaceholder")}
            maxLength={2000}
            multiline
            onChange={(description) => setState((s) => ({ ...s, description }))}
          />
          <FocusField
            value={state.focus}
            onChange={(focus) => setState((s) => ({ ...s, focus }))}
          />
          {state.items.map((item, i) => (
            <ItemEditor
              key={i}
              kind={state.kind}
              item={item}
              name={nameOf(item.exercise)}
              measure={doseMeasureOf(exerciseNamed(item.exercise))}
              unit={model.settings.units}
              onChange={(next) => setState((s) => withItem(s, i, next))}
              onRemove={() => setState((s) => withoutItem(s, i))}
              onSwap={() => setPicking({ swap: i })}
            />
          ))}
          <TimeField
            label={t("workouts.exerciseRest")}
            value={state.exerciseRestS}
            max={3600}
            onChange={(exerciseRestS) => setState((s) => ({ ...s, exerciseRestS }))}
          />
          <Button
            label={t("workouts.addExercises")}
            onPress={() => setPicking("add")}
            variant="outline"
            icon="plus"
            height={48}
          />
          {state.kind === "hangboard" ? (
            <HangboardTiming minutes={workoutMinutes(state)} />
          ) : (
            <TimeField
              label={t("common.duration")}
              value={(state.minutes ?? 0) * 60}
              max={MAX_MINUTES * 60}
              onChange={(seconds) => setState((s) => ({ ...s, minutes: usualMinutes(seconds) }))}
            />
          )}
          <TargetEffort
            value={state.targetRpe}
            onChange={(targetRpe) => setState((s) => ({ ...s, targetRpe }))}
          />
        </KeypadScrollView>
      </KeyboardAvoidingView>
      {picking !== null && (
        <ExercisePickerSheet
          kind={state.kind}
          items={state.items}
          multi={picking === "add"}
          onPick={(picked) =>
            setState((s) =>
              picking === "add"
                ? withItemsAdded(s, picked)
                : withExerciseSwapped(s, picking.swap, picked[0]?.exercise ?? "")
            )
          }
          onClose={() => setPicking(null)}
        />
      )}
    </SafeAreaView>
  );
}

/** Make, edit or customise a workout of any kind: what it holds, and how each exercise rests and alternates. */
export function WorkoutEditorScreen(props: WorkoutEditorScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const initial = initialDraft(state.data, props);
  return initial === null ? null : <Editor id={props.id} initial={initial} />;
}
