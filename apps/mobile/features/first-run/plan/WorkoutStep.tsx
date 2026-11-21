import { randomUUID } from "expo-crypto";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { gripMeasureOf, type Item } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  entryNamed,
  exerciseKindIn,
  exerciseLabel,
  isGripOf,
  pickedOf,
  pickerEntries,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import {
  defaultWorkoutName,
  keptName,
  nameOr,
  setPlanPath,
  usePlanPath,
  type Wizard,
} from "@sendtally/features/settings";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  doseMeasureOf,
  draftOf,
  draftOfEditor,
  editorBlockAt,
  estimatedMinutes,
  newWorkoutDraft,
  useDerivedKindDraft,
  useWorkoutActions,
  withEditorIds,
  withGroupSet,
  withItem,
  withItemsAdded,
  withMemberOut,
  withSetRest,
  withSupersetWithNext,
  withUngrouped,
  withoutItem,
  type Picked,
  type WorkoutDraft,
} from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { TextInput } from "../../../components/TextInput";
import { press } from "../../../lib/press";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { NameField } from "../../training/components/NameField";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { usePickerWorld } from "../../training/exercise-picker/usePickerWorld";
import { usePick } from "../../training/exercise-picker/usePick";
import { useMakeExercise } from "../../training/exercises/useMakeExercise";
import { useLibrary } from "../../training/library/useLibrary";
import { type } from "../../training/type";
import { ItemEditor } from "../../training/workout-editor/ItemEditor";
import { SupersetEditor } from "../../training/workout-editor/SupersetEditor";
import { WizardFrame } from "../WizardFrame";
import { YoursTag } from "./components/YoursTag";

const SUGGESTED = 6;

const NEW_REST_S = 120;

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

/** P2: a workout the user already does, from library exercises and ones they name, saved on Continue. */
export function WorkoutStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const { building } = usePlanPath();
  const { state } = useLibrary();
  const [id] = React.useState(() => building ?? randomUUID());
  if (state.status !== "ready") return <WizardFrame wizard={wizard}>{null}</WizardFrame>;
  const saved = state.data.workout(id);
  const initial =
    saved === undefined ? newWorkoutDraft("other") : withEditorIds(draftOf(saved), randomUUID);
  return <Builder wizard={wizard} api={api} id={id} initial={initial} />;
}

function Builder({
  wizard,
  api,
  id,
  initial,
}: {
  wizard: Wizard;
  api: SendtallyApi;
  id: string;
  initial: WorkoutDraft;
}): React.ReactElement {
  const actions = useWorkoutActions(api, reportFailure);
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
  const { model } = useHangData();
  const pick = usePick();
  const make = useMakeExercise();
  const [text, setText] = React.useState("");
  const [typedName, setTypedName] = React.useState<string | null>(() =>
    initial.name.trim() === "" ? null : initial.name
  );
  const world = usePickerWorld([], "all");
  const isGrip = isGripOf(world);
  const kindIn = exerciseKindIn(world);
  const { state, setState, remember } = useDerivedKindDraft(initial, kindIn);
  const inWorkout = state.items.map((i) => exerciseKey(i.exercise));
  const typed = text.trim();
  const matches = pickerEntries(
    { ...world, inWorkout: state.items.map((i) => i.exercise) },
    { category: "all", text }
  )
    .filter((e) => !e.inWorkout)
    .slice(0, SUGGESTED);
  const named = typed === "" ? undefined : entryNamed(world, typed);
  const isNew = typed !== "" && named === undefined && !inWorkout.includes(exerciseKey(typed));

  const ownNamed = (exercise: string) =>
    mine.find((e) => exerciseKey(e.name) === exerciseKey(exercise));
  const nameOf = (exercise: string): string => {
    if (isGrip(exercise)) return model.gripName(exercise);
    const own = ownNamed(exercise);
    return own === undefined ? exercise : exerciseLabel(own);
  };
  const isYours = (exercise: string): boolean =>
    isGrip(exercise)
      ? world.grips.some((g) => g.id === exercise && g.custom === true)
      : ownNamed(exercise)?.builtIn === null;

  const added = (picked: Picked | null): void => {
    if (picked === null) return;
    remember([picked]);
    setState((s) => {
      const next = withItemsAdded(s, [picked], randomUUID, isGrip);
      return {
        ...next,
        items: next.items.map((i) =>
          s.items.includes(i) || i.doses[0]?.setRestS !== undefined ? i : withSetRest(i, NEW_REST_S)
        ),
      };
    });
    setText("");
  };
  const addEntry = (entry: PickerEntry): void => void pick(entry.source).then(added);
  const addNew = (): void => {
    const kind = state.items.length === 0 || state.kind === "other" ? "strength" : state.kind;
    void make({ kind, name: typed, measure: "repsWeight", eachSide: false }).then((m) =>
      added(m === null ? null : pickedOf(m))
    );
  };
  const submit = (): void => {
    if (named !== undefined) addEntry(named);
    else if (isNew) addNew();
  };

  const card = (item: Item, i: number, letter?: number): React.ReactElement => (
    <ItemEditor
      kind={isGrip(item.exercise) ? "hangboard" : state.kind}
      item={item}
      name={nameOf(item.exercise)}
      measure={
        isGrip(item.exercise)
          ? gripMeasureOf(item.doses[0] ?? { sets: 1 })
          : doseMeasureOf(ownNamed(item.exercise))
      }
      unit={model.settings.units}
      member={letter}
      compact
      tag={isYours(item.exercise) ? <YoursTag /> : undefined}
      onChange={(next) => setState((s) => withItem(s, i, next))}
      onRemove={() =>
        setState((s) => (letter === undefined ? withoutItem(s, i) : withMemberOut(s, i, kindIn)))
      }
    />
  );

  const minutes = estimatedMinutes(state) ?? 0;
  const count = state.items.length;
  const ready = count > 0;
  const first = state.items[0];
  const name = nameOr(
    typedName,
    defaultWorkoutName(first === undefined ? undefined : kindIn(first.exercise))
  );
  const save = (): void => {
    void actions.saveWorkout(id, draftOfEditor({ ...state, name }));
    setPlanPath((p) => ({
      ...p,
      building: id,
      workouts: p.workouts.includes(id) ? p.workouts : [id, ...p.workouts],
    }));
    wizard.next();
  };

  return (
    <WizardFrame
      wizard={wizard}
      footer={
        <Button
          variant="primary"
          height={54}
          disabled={!ready}
          label={
            count === 0
              ? t("onboarding.firstRun.continue")
              : t("onboarding.plan.workout.continue", { count, minutes })
          }
          onPress={save}
        />
      }
    >
      <View style={{ gap: 8 }}>
        <Title size={34}>{t("onboarding.plan.workout.title")}</Title>
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
          {t("onboarding.plan.workout.body")}
        </Text>
      </View>
      <View style={{ gap: 4 }}>
        <Label color={colors.textSecondary}>{t("onboarding.plan.workout.nameLabel")}</Label>
        <NameField
          value={typedName ?? name}
          onChange={setTypedName}
          onBlur={() => setTypedName(keptName)}
          selectTextOnFocus
          placeholder=""
          maxLength={80}
        />
      </View>
      <View style={{ gap: 10 }}>
        <Label color={colors.gunmetal}>{t("onboarding.plan.workout.exercises")}</Label>
        {state.items.map((item, i) => {
          const g = item.group;
          const block = editorBlockAt(state, i, kindIn);
          if (block === null) return null;
          const { members, last, offer } = block;
          return (
            <React.Fragment key={item.id ?? i}>
              {g === undefined ? (
                card(item, i)
              ) : (
                <SupersetEditor
                  group={g}
                  title={t("onboarding.plan.workout.supersetPair", {
                    first: nameOf(state.items[members[0] ?? i]?.exercise ?? ""),
                    second: nameOf(state.items[last]?.exercise ?? ""),
                  })}
                  onChange={(change) => setState((s) => withGroupSet(s, g.id, change, kindIn))}
                  onUngroup={() => setState((s) => withUngrouped(s, g.id))}
                >
                  {members.map((at) => {
                    const m = state.items[at];
                    return m === undefined ? null : (
                      <React.Fragment key={m.id ?? at}>
                        {card(m, at, members.indexOf(at))}
                      </React.Fragment>
                    );
                  })}
                </SupersetEditor>
              )}
              {offer && (
                <View style={{ flexDirection: "row", marginVertical: -6 }}>
                  <Button
                    label={t("workouts.supersetWithNext")}
                    onPress={() =>
                      setState((s) => withSupersetWithNext(s, last, randomUUID, kindIn))
                    }
                    variant="link"
                    height={40}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder={t("onboarding.plan.workout.searchPlaceholder")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("onboarding.plan.workout.searchPlaceholder")}
          returnKeyType="done"
          maxLength={80}
          style={[
            type.body,
            {
              height: 50,
              paddingHorizontal: 14,
              borderRadius: 12,
              fontSize: 15,
              color: colors.gunmetal,
              backgroundColor: colors.surfaceSoft,
            },
          ]}
        />
        {isNew && (
          <View
            style={{
              minHeight: 52,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
                {t("workouts.noExerciseCalled", { name: typed })}
              </Text>
              <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                {t("onboarding.plan.workout.newExerciseNamed", { name: typed })}
              </Text>
            </View>
            <Button
              label={t("workouts.newShort")}
              accessibilityLabel={t("onboarding.plan.workout.newExerciseNamed", { name: typed })}
              onPress={addNew}
              variant="outline"
              icon="plus"
              height={40}
            />
          </View>
        )}
        {matches.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {matches.map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => addEntry(entry)}
                accessibilityRole="button"
                accessibilityLabel={t("plan.addNamed", { name: entry.name })}
                style={press({
                  minHeight: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 13,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                })}
              >
                <Icon name="plus" size={12} strokeWidth={2.6} color={colors.gunmetal} />
                <Text style={[type.body, { fontSize: 13, color: colors.gunmetal }]}>
                  {entry.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </WizardFrame>
  );
}
