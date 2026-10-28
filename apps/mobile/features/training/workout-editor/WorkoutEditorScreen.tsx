import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sessionItems, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { hangWorkoutFromItem } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  copyName,
  draftOf,
  newWorkoutDraft,
  useWorkoutActions,
  workoutMinutes,
  type WorkoutDraft,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { TextInput } from "../../../components/TextInput";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { useLibrary } from "../library/useLibrary";
import { MinutesField } from "../plan/MinutesField";
import { TargetEffort } from "../plan/TargetEffort";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { EditorTextField } from "./EditorTextField";
import { HangboardTiming } from "./HangboardTiming";
import {
  draftOfEditor,
  newItem,
  startingDraft,
  withItem,
  withItemAdded,
  withoutItem,
} from "./editorState";
import { ItemEditor } from "./ItemEditor";
import { RestField } from "./RestField";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type WorkoutEditorScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this kind. */
  kind?: WorkoutKind;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function initialDraft(
  library: WorkoutLibrary,
  { id, from, kind }: WorkoutEditorScreenProps
): WorkoutDraft | null {
  const base = library.workout(id ?? from ?? "");
  if (base !== undefined) {
    const draft = draftOf(base);
    return id === undefined ? { ...draft, name: copyName(draft.name) } : draft;
  }
  return kind === undefined ? null : startingDraft(newWorkoutDraft(kind));
}

function Editor({
  id,
  initial,
}: {
  id: string | undefined;
  initial: WorkoutDraft;
}): React.ReactElement {
  const actions = useWorkoutActions(useApi(), reportFailure);
  const { model } = useHangData();
  const [state, setState] = React.useState(initial);
  const [untouched] = React.useState(initial);
  const [gripFor, setGripFor] = React.useState<number | null>(null);

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

  const picking = gripFor === null ? undefined : state.items[gripFor];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        <Button label={t("hang.cancel")} onPress={cancel} variant="link" height={44} />
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}
        </Text>
        <Button label={t("hang.save")} onPress={save} variant="link" height={44} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 18,
            paddingTop: 6,
            paddingHorizontal: 18,
            paddingBottom: 28,
          }}
        >
          <View style={{ gap: 4 }}>
            <Label color={KIND_LOOK[state.kind].ink}>{kindLabel(state.kind)}</Label>
            <TextInput
              value={state.name}
              onChangeText={(name) => setState((s) => ({ ...s, name }))}
              placeholder={t("workouts.namePlaceholder")}
              placeholderTextColor={colors.textFaint}
              accessibilityLabel={t("hang.name")}
              maxLength={80}
              style={[type.display, { fontSize: 30, paddingVertical: 4, color: colors.gunmetal }]}
            />
          </View>
          <EditorTextField
            label={t("workouts.description")}
            value={state.description}
            placeholder={t("workouts.descriptionPlaceholder")}
            maxLength={2000}
            multiline
            onChange={(description) => setState((s) => ({ ...s, description }))}
          />
          {state.items.map((item, i) => (
            <ItemEditor
              key={i}
              kind={state.kind}
              item={item}
              unit={model.settings.units}
              gripName={model.gripName}
              onChange={(next) => setState((s) => withItem(s, i, next))}
              onRemove={() => setState((s) => withoutItem(s, i))}
              onPickGrip={() => setGripFor(i)}
            />
          ))}
          <RestField
            label={t("workouts.exerciseRest")}
            seconds={state.exerciseRestS}
            onChange={(exerciseRestS) => setState((s) => ({ ...s, exerciseRestS }))}
            soft
          />
          <Button
            label={state.kind === "hangboard" ? t("workouts.addGrip") : t("workouts.addExercise")}
            onPress={() => setState(withItemAdded)}
            variant="outline"
            icon="plus"
            height={44}
          />
          {state.kind === "hangboard" ? (
            <HangboardTiming minutes={workoutMinutes(state)} />
          ) : (
            <MinutesField
              value={state.minutes}
              onChange={(minutes) => setState((s) => ({ ...s, minutes }))}
            />
          )}
          <TargetEffort
            value={state.targetRpe}
            onChange={(targetRpe) => setState((s) => ({ ...s, targetRpe }))}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {state.kind === "hangboard" && (
        <GripPickerSheet
          visible={picking !== undefined}
          workout={hangWorkoutFromItem(
            { id: id ?? "", source: "mine", name: state.name },
            sessionItems([picking ?? newItem("hangboard")], 0)[0] ?? {
              exercise: "",
              dose: { sets: 1 },
            }
          )}
          multi={false}
          selected={picking === undefined ? [] : [picking.exercise]}
          onPick={(exercise) => {
            if (gripFor !== null && picking !== undefined)
              setState((s) => withItem(s, gripFor, { ...picking, exercise }));
          }}
          onClose={() => setGripFor(null)}
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
