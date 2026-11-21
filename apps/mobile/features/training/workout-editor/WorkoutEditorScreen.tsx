import { randomUUID } from "expo-crypto";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  gripMeasureOf,
  restAfterItem,
  type Focus,
  type Item,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { exerciseKindIn, exerciseLabel, isGripOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  copyName,
  draftOf,
  estimatedMinutes,
  newWorkoutDraft,
  useWorkoutActions,
  workoutMinutes,
  type WorkoutDraft,
  type WorkoutLibrary,
  pickingForSuperset,
  type EditorPicking,
  editorBlockAt,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EditorHeader } from "../components/EditorHeader";
import { FocusField } from "../components/FocusField";
import { NameField } from "../components/NameField";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { ExercisePickerSheet } from "../exercise-picker/ExercisePickerSheet";
import { usePickerWorld } from "../exercise-picker/usePickerWorld";
import { useLibrary } from "../library/useLibrary";
import { TargetEffort } from "../plan/TargetEffort";
import { EditorTextField } from "../components/EditorTextField";
import { HangboardTiming } from "./HangboardTiming";
import {
  draftOfEditor,
  withExerciseSwapped,
  withItem,
  withItemsAdded,
  withChecklistAdded,
  withAddedToGroup,
  withGroupSet,
  withMemberOut,
  withSupersetWithNext,
  withEditorMoved,
  canAddToGroup,
  withUngrouped,
  useDerivedKindDraft,
  withEditorIds,
  withRestAfter,
  withoutItem,
} from "@sendtally/features/workouts";
import { doseMeasureOf, itemTitle } from "@sendtally/features/workouts";
import { ChecklistEditor } from "./ChecklistEditor";
import { ItemEditor } from "./ItemEditor";
import { SupersetEditor } from "./SupersetEditor";
import type { AddFlow } from "@sendtally/features/training";
import { useAddTo } from "../planning/useAddTo";
import { useDiscardGuard } from "../../../lib/useDiscardGuard";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { TimeField } from "../../../components/TimeField";
import { GapRest } from "./GapRest";
import { goBack } from "../../../lib/goBack";

const MAX_MINUTES = 600;

/** None at zero, else the whole minutes typed. */
const usualMinutes = (seconds: number): number | null =>
  seconds === 0 ? null : Math.min(MAX_MINUTES, Math.max(1, Math.round(seconds / 60)));

export type WorkoutEditorScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this kind; Other by default, until its exercises say otherwise. */
  kind?: WorkoutKind;
  /** A new workout's focus, from the shelf it was made on; General by default. */
  focus?: Focus | null;
  /** Made from the add sheet: saved, it is added where the sheet adds. */
  adding?: AddFlow;
};

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

function initialDraft(
  library: WorkoutLibrary,
  { id, from, kind, focus = null }: WorkoutEditorScreenProps
): WorkoutDraft | null {
  const base = library.workout(id ?? from ?? "");
  if (base !== undefined) {
    const draft = withEditorIds(draftOf(base), randomUUID);
    return id === undefined ? { ...draft, name: copyName(draft.name) } : draft;
  }
  if (id !== undefined || from !== undefined) return null;
  return { ...newWorkoutDraft(kind ?? "other"), focus };
}

function Editor({
  id,
  initial,
  adding,
}: {
  id: string | undefined;
  initial: WorkoutDraft;
  adding: AddFlow | undefined;
}): React.ReactElement {
  const api = useApi();
  const addTo = useAddTo(adding ?? { date: null, blockId: null });
  const actions = useWorkoutActions(api, reportFailure);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  const world = usePickerWorld([], "all");
  const isGrip = isGripOf(world);
  const kindIn = exerciseKindIn(world);
  const { state, setState, remember } = useDerivedKindDraft(initial, kindIn);
  const estimate = estimatedMinutes(state);
  const [untouched] = React.useState(initial);
  const release = useDiscardGuard(state !== untouched);
  const [picking, setPicking] = React.useState<EditorPicking | null>(null);
  const exerciseNamed = (name: string) =>
    exercises.status === "ready"
      ? exercises.data.find((e) => exerciseKey(e.name) === exerciseKey(name))
      : undefined;
  const measureOf = (item: Item) =>
    isGrip(item.exercise)
      ? gripMeasureOf(item.doses[0] ?? { sets: 1 })
      : doseMeasureOf(exerciseNamed(item.exercise));
  const nameOf = (exercise: string): string => {
    if (isGrip(exercise)) return model.gripName(exercise);
    const own = exerciseNamed(exercise);
    return own === undefined ? exercise : exerciseLabel(own);
  };

  const itemCard = (
    item: Item,
    i: number,
    inGroup?: { first: number; last: number; letter: number }
  ): React.ReactElement => {
    const up = inGroup === undefined ? i > 0 : i > inGroup.first;
    const down = inGroup === undefined ? i < state.items.length - 1 : i < inGroup.last;
    return item.checklist !== undefined ? (
      <ChecklistEditor
        item={item}
        onChange={(update) =>
          setState((s) => {
            const now = s.items[i];
            return now === undefined ? s : withItem(s, i, update(now));
          })
        }
        onRemove={() => setState((s) => withoutItem(s, i))}
        {...(up && { onMoveUp: () => setState((s) => withEditorMoved(s, i, -1, kindIn)) })}
        {...(down && {
          onMoveDown: () => setState((s) => withEditorMoved(s, i, 1, kindIn)),
        })}
      />
    ) : (
      <ItemEditor
        kind={isGrip(item.exercise) ? "hangboard" : state.kind}
        item={item}
        name={nameOf(item.exercise)}
        measure={measureOf(item)}
        unit={model.settings.units}
        onChange={(next) => setState((s) => withItem(s, i, next))}
        onRemove={() =>
          setState((s) => (inGroup === undefined ? withoutItem(s, i) : withMemberOut(s, i, kindIn)))
        }
        member={inGroup?.letter}
        onSwap={() => setPicking({ swap: i })}
        {...(up && { onMoveUp: () => setState((s) => withEditorMoved(s, i, -1, kindIn)) })}
        {...(down && {
          onMoveDown: () => setState((s) => withEditorMoved(s, i, 1, kindIn)),
        })}
      />
    );
  };

  const save = (): void => {
    const saved = id ?? randomUUID();
    release();
    void actions.saveWorkout(saved, draftOfEditor(state));
    if (adding !== undefined && id === undefined) addTo.add(saved);
    goBack();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <EditorHeader
        title={id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}
        onCancel={() => goBack()}
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
          <NameField
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
          {state.items.map((item, i) => {
            const g = item.group;
            const block = editorBlockAt(state, i, kindIn);
            if (block === null) return null;
            const { members, last, offer } = block;
            return (
              <React.Fragment key={item.id ?? i}>
                {i > 0 && (
                  <GapRest
                    after={itemTitle(state.items[i - 1] ?? { exercise: "" }, nameOf)}
                    seconds={restAfterItem(state.items, i - 1, state.exerciseRestS)}
                    onChange={(seconds) => setState((s) => withRestAfter(s, i - 1, seconds))}
                  />
                )}
                {g === undefined ? (
                  itemCard(item, i)
                ) : (
                  <SupersetEditor
                    group={g}
                    onChange={(change) => setState((s) => withGroupSet(s, g.id, change, kindIn))}
                    onUngroup={() => setState((s) => withUngrouped(s, g.id))}
                    onAdd={
                      canAddToGroup(state, g.id) ? () => setPicking({ group: g.id }) : undefined
                    }
                    {...((members[0] ?? 0) > 0 && {
                      onMoveUp: () =>
                        setState((s) => withEditorMoved(s, members[0] ?? 0, -1, kindIn, true)),
                    })}
                    {...(last < state.items.length - 1 && {
                      onMoveDown: () => setState((s) => withEditorMoved(s, last, 1, kindIn, true)),
                    })}
                  >
                    {members.map((at) => {
                      const m = state.items[at];
                      return m === undefined ? null : (
                        <React.Fragment key={m.id ?? at}>
                          {itemCard(m, at, {
                            first: members[0] ?? at,
                            last,
                            letter: members.indexOf(at),
                          })}
                        </React.Fragment>
                      );
                    })}
                  </SupersetEditor>
                )}
                {offer && (
                  <View style={{ flexDirection: "row", marginTop: -8 }}>
                    <Button
                      label={t("workouts.supersetWithNext")}
                      onPress={() =>
                        setState((s) => withSupersetWithNext(s, last, randomUUID, kindIn))
                      }
                      variant="link"
                      height={36}
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t("workouts.addExercises")}
                onPress={() => setPicking("add")}
                variant="outline"
                icon="plus"
                height={48}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("workouts.addChecklist")}
                onPress={() => setState((s) => withChecklistAdded(s, randomUUID))}
                variant="outline"
                icon="plus"
                height={48}
              />
            </View>
          </View>
          {state.kind === "hangboard" ? (
            <HangboardTiming minutes={workoutMinutes(state)} />
          ) : (
            <TimeField
              label={t("common.duration")}
              value={(state.minutes ?? 0) * 60}
              max={MAX_MINUTES * 60}
              {...(estimate !== null && { placeholder: `~${durationLabel(estimate)}` })}
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
          items={state.items}
          multi={picking === "add" || "group" in picking}
          superset={pickingForSuperset(state, picking)}
          onPick={(list) => {
            remember(list);
            setState((s) =>
              picking === "add"
                ? withItemsAdded(s, list, randomUUID, isGrip)
                : "group" in picking
                  ? withAddedToGroup(s, picking.group, list, randomUUID, kindIn)
                  : withExerciseSwapped(
                      s,
                      picking.swap,
                      list[0] ?? { exercise: "", kind: s.kind },
                      isGrip,
                      kindIn
                    )
            );
          }}
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
  return initial === null ? null : <Editor id={props.id} initial={initial} adding={props.adding} />;
}
