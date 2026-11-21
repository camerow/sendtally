import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { gripMeasureOf, type Item } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import {
  entryNamed,
  exerciseKindIn,
  exerciseLabel,
  isGripOf,
  pickedOf,
  pickerEntries,
  usePickerWorld,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import {
  defaultWorkoutName,
  keptName,
  nameOr,
  setPlanPath,
  type Wizard,
} from "@sendtally/features/settings";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  doseMeasureOf,
  draftOfEditor,
  editorBlockAt,
  estimatedMinutes,
  useDerivedKindDraft,
  useWorkoutActions,
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
import { ComboField, type ComboItem } from "../../../components/ComboField";
import { useToast } from "../../../components/Toast";
import { NameField } from "../../../training/components/NameField";
import { useHangData } from "../../../training/data/HangDataContext";
import { ItemEditor } from "../../../training/editor/ItemEditor";
import { SupersetEditor } from "../../../training/editor/SupersetEditor";
import { useMake, usePick } from "../../../training/editor/useMake";
import { WizardFrame } from "../../WizardFrame";
import { YoursTag } from "./YoursTag";

const SUGGESTED = 6;

const NEW_REST_S = 120;

const newId = (): string => crypto.randomUUID();

export type WorkoutBuilderProps = {
  wizard: Wizard;
  api: SendtallyApi;
  id: string;
  initial: WorkoutDraft;
};

/** P2's body: the workout's name, its exercise cards, and the search that adds to them. */
export function WorkoutBuilder({
  wizard,
  api,
  id,
  initial,
}: WorkoutBuilderProps): React.ReactElement {
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useWorkoutActions(api, failed);
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : [];
  const { model } = useHangData();
  const pick = usePick();
  const make = useMake();
  const [text, setText] = React.useState("");
  const [typedName, setTypedName] = React.useState<string | null>(() =>
    initial.name.trim() === "" ? null : initial.name
  );
  const world = usePickerWorld(api, model, [], "all");
  const isGrip = isGripOf(world);
  const kindIn = exerciseKindIn(world);
  const { state, setState, remember } = useDerivedKindDraft(initial, kindIn);
  const inWorkout = state.items.map((i) => exerciseKey(i.exercise));
  const typed = text.trim();
  const named = typed === "" ? undefined : entryNamed(world, typed);
  const isNew = typed !== "" && named === undefined && !inWorkout.includes(exerciseKey(typed));
  const matches = pickerEntries(
    { ...world, inWorkout: state.items.map((i) => i.exercise) },
    { category: "all", text }
  )
    .filter((e) => !e.inWorkout && e.key !== named?.key)
    .slice(0, SUGGESTED);

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
      const next = withItemsAdded(s, [picked], newId, isGrip);
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
  const entryItem = (entry: PickerEntry): ComboItem => ({
    key: entry.key,
    label: entry.name,
    onPick: () => addEntry(entry),
  });
  const items: ComboItem[] = [
    ...(named === undefined || named.inWorkout ? [] : [entryItem(named)]),
    ...(isNew
      ? [
          {
            key: "new",
            label: t("onboarding.plan.workout.newExerciseNamed", { name: typed }),
            meta: t("workouts.newShort"),
            action: true,
            onPick: addNew,
          },
        ]
      : []),
    ...matches.map(entryItem),
  ];

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
        <Button variant="azure" disabled={!ready} onClick={save}>
          {count === 0
            ? t("onboarding.firstRun.continue")
            : t("onboarding.plan.workout.continue", { count, minutes })}
        </Button>
      }
    >
      <div className="plan-path-head">
        <h1 className="wizard-title">{t("onboarding.plan.workout.title")}</h1>
        <p className="plan-path-body">{t("onboarding.plan.workout.body")}</p>
      </div>
      <div
        className="field"
        onFocus={(e) => e.target instanceof HTMLTextAreaElement && e.target.select()}
        onBlur={() => setTypedName(keptName)}
      >
        <span className="train-label">{t("onboarding.plan.workout.nameLabel")}</span>
        <NameField
          label={t("onboarding.plan.workout.nameLabel")}
          value={typedName ?? name}
          maxLength={80}
          placeholder=""
          onChange={setTypedName}
        />
      </div>
      <div className="plan-path-section">
        <span className="train-label">{t("onboarding.plan.workout.exercises")}</span>
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
                <button
                  type="button"
                  className="text-button superset-offer"
                  onClick={() => setState((s) => withSupersetWithNext(s, last, newId, kindIn))}
                >
                  {t("workouts.supersetWithNext")}
                </button>
              )}
            </React.Fragment>
          );
        })}
        <ComboField
          inline
          value={text}
          items={items}
          placeholder={t("onboarding.plan.workout.searchPlaceholder")}
          ariaLabel={t("onboarding.plan.workout.searchPlaceholder")}
          className="form-input plan-path-search"
          inputStyle={{}}
          onChange={(value) => setText(value.slice(0, 80))}
        />
        {isNew && (
          <p className="plan-path-hint">{t("workouts.noExerciseCalled", { name: typed })}</p>
        )}
      </div>
    </WizardFrame>
  );
}
