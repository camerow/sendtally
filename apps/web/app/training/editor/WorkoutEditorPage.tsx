import React from "react";
import { NameField } from "../components/NameField";
import { useNavigate } from "react-router";
import {
  gripMeasureOf,
  restAfterItem,
  type Focus,
  type Item,
  type WorkoutKind,
} from "@sendtally/core/hang";
import {
  exerciseKindIn,
  exerciseLabel,
  isGripOf,
  usePickerWorld,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  copyName,
  doseMeasureOf,
  draftOf,
  draftOfEditor,
  estimatedMinutes,
  newWorkoutDraft,
  useWorkoutActions,
  useDerivedKindDraft,
  withEditorIds,
  withExerciseSwapped,
  itemTitle,
  withItem,
  withRestAfter,
  withItemsAdded,
  withChecklistAdded,
  withAddedToGroup,
  withGroupSet,
  withMemberOut,
  withSupersetWithNext,
  withEditorMoved,
  canAddToGroup,
  withUngrouped,
  withoutItem,
  workoutMinutes,
  type WorkoutDraft,
  type WorkoutLibrary,
  pickingForSuperset,
  type EditorPicking,
  editorBlockAt,
} from "@sendtally/features/workouts";
import { NumberField } from "../../components/NumberField";
import { GapRest } from "./GapRest";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useDiscardGuard } from "../../lib/useDiscardGuard";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { WORKOUTS_VIEW, useLibrary, workoutPath } from "../library/useLibrary";
import { FocusField } from "../log/FocusField";
import { ExercisePicker } from "./ExercisePicker";
import { ChecklistEditor } from "./ChecklistEditor";
import { ItemEditor } from "./ItemEditor";
import { SupersetEditor } from "./SupersetEditor";
import { TargetEffort } from "./TargetEffort";

const MAX_MINUTES = 600;

/** None at zero, else the whole minutes typed. */
const usualMinutes = (seconds: number): number | null =>
  seconds === 0 ? null : Math.min(MAX_MINUTES, Math.max(1, Math.round(seconds / 60)));

const newId = (): string => crypto.randomUUID();

export type WorkoutEditorProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Start from a copy of this workout, built in or the user's own. */
  from?: string;
  /** A new workout of this kind; Other by default, until its exercises say otherwise. */
  kind?: WorkoutKind;
  /** A new workout's focus, from the shelf it was made on; General by default. */
  focus?: Focus | null;
};

function initialDraft(
  library: WorkoutLibrary,
  { id, from, kind, focus = null }: WorkoutEditorProps
): WorkoutDraft | null {
  const base = library.workout(id ?? from ?? "");
  if (base !== undefined) {
    const draft = withEditorIds(draftOf(base), newId);
    return id === undefined ? { ...draft, name: copyName(draft.name) } : draft;
  }
  if (id !== undefined || from !== undefined) return null;
  return { ...newWorkoutDraft(kind ?? "other"), focus };
}

function Editor({
  id,
  initial,
}: {
  id: string | undefined;
  initial: WorkoutDraft;
}): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const back = useGoBack(WORKOUTS_VIEW);
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useWorkoutActions(api, failed);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  const [untouched] = React.useState(initial);
  const world = usePickerWorld(api, model, [], "all");
  const isGrip = isGripOf(world);
  const kindIn = exerciseKindIn(world);
  const { state, setState, remember } = useDerivedKindDraft(untouched, kindIn);
  const guard = useDiscardGuard(state !== untouched);
  const [picking, setPicking] = React.useState<EditorPicking | null>(null);
  const descriptionId = React.useId();
  const estimate = estimatedMinutes(state);
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
    const saved = id ?? newId();
    guard.release();
    void actions.saveWorkout(saved, draftOfEditor(state));
    if (id === undefined) void navigate(workoutPath(saved), { replace: true });
    else back();
  };

  return (
    <DetailFrame
      backTo={WORKOUTS_VIEW}
      editor={{
        title: id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout"),
        onSave: save,
        heading: true,
      }}
    >
      <NameField
        label={t("hang.name")}
        value={state.name}
        maxLength={80}
        placeholder={t("workouts.namePlaceholder")}
        onChange={(name) => setState((s) => ({ ...s, name }))}
      />
      <div className="form-section">
        <label htmlFor={descriptionId} className="train-label">
          {t("workouts.description")}
        </label>
        <textarea
          id={descriptionId}
          className="form-input form-notes"
          value={state.description}
          maxLength={2000}
          placeholder={t("workouts.descriptionPlaceholder")}
          onChange={(e) => {
            const description = e.target.value;
            setState((s) => ({ ...s, description }));
          }}
        />
      </div>
      <FocusField value={state.focus} onChange={(focus) => setState((s) => ({ ...s, focus }))} />
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
                onAdd={canAddToGroup(state, g.id) ? () => setPicking({ group: g.id }) : undefined}
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
      <div className="editor-add-row">
        <button
          type="button"
          className="outline-button outline-button--wide"
          onClick={() => setPicking("add")}
        >
          + {t("workouts.addExercises")}
        </button>
        <button
          type="button"
          className="outline-button outline-button--wide"
          onClick={() => setState((s) => withChecklistAdded(s, newId))}
        >
          + {t("workouts.addChecklist")}
        </button>
      </div>
      {state.kind === "hangboard" ? (
        <div className="total-time">
          <span className="train-label">{t("workouts.totalTime")}</span>
          <span>
            {workoutMinutes(state) === null ? "–" : durationLabel(workoutMinutes(state) ?? 0)}
          </span>
        </div>
      ) : (
        <NumberField
          label={t("common.duration")}
          value={state.minutes === null ? null : state.minutes * 60}
          placeholder={estimate === null ? undefined : `~${durationLabel(estimate)}`}
          mode={{ kind: "time", max: MAX_MINUTES * 60 }}
          onChange={(seconds) => setState((s) => ({ ...s, minutes: usualMinutes(seconds) }))}
        />
      )}
      <TargetEffort
        value={state.targetRpe}
        onChange={(targetRpe) => setState((s) => ({ ...s, targetRpe }))}
      />
      {picking !== null && (
        <ExercisePicker
          items={state.items}
          multi={picking === "add" || "group" in picking}
          superset={pickingForSuperset(state, picking)}
          onPick={(list) => {
            remember(list);
            setState((s) =>
              picking === "add"
                ? withItemsAdded(s, list, newId, isGrip)
                : "group" in picking
                  ? withAddedToGroup(s, picking.group, list, newId, kindIn)
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
      {guard.sheet}
    </DetailFrame>
  );
}

/** Make or edit a workout of any kind: what it holds, and how each exercise rests and alternates. */
export function WorkoutEditorPage(props: WorkoutEditorProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  const initial = initialDraft(state.data, props);
  return initial === null ? null : <Editor id={props.id} initial={initial} />;
}
