import React from "react";
import { useNavigate } from "react-router";
import { gripMeasureOf, type Focus, type Item, type WorkoutKind } from "@sendtally/core/hang";
import { exerciseLabel } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import {
  doseMeasureOf,
  draftOf,
  draftOfEditor,
  estimatedMinutes,
  newWorkoutDraft,
  useWorkoutActions,
  withEditorIds,
  withExerciseSwapped,
  withItem,
  withItemMoved,
  withItemsAdded,
  withoutItem,
  workoutMinutes,
  type WorkoutDraft,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { NumberField } from "../../components/NumberField";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary, workoutPath } from "../library/useLibrary";
import { FocusField } from "../log/FocusField";
import { ExercisePicker } from "./ExercisePicker";
import { ItemEditor } from "./ItemEditor";
import { TargetEffort } from "./TargetEffort";

const MAX_MINUTES = 600;

/** None at zero, else the whole minutes typed. */
const usualMinutes = (seconds: number): number | null =>
  seconds === 0 ? null : Math.min(MAX_MINUTES, Math.max(1, Math.round(seconds / 60)));

const newId = (): string => crypto.randomUUID();

export type WorkoutEditorProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** A new workout of this kind. */
  kind?: WorkoutKind;
  /** A new workout's focus, from the shelf it was made on; General by default. */
  focus?: Focus | null;
};

function initialDraft(
  library: WorkoutLibrary,
  { id, kind, focus = null }: WorkoutEditorProps
): WorkoutDraft | null {
  const base = library.workout(id ?? "");
  if (base !== undefined) return withEditorIds(draftOf(base), newId);
  return kind === undefined ? null : { ...newWorkoutDraft(kind), focus };
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
  const back = useGoBack("/app/train");
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useWorkoutActions(api, failed);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  const [state, setState] = React.useState(initial);
  const [discarding, setDiscarding] = React.useState(false);
  const [picking, setPicking] = React.useState<{ swap: number } | "add" | null>(null);
  const descriptionId = React.useId();
  const estimate = estimatedMinutes(state);
  const exerciseNamed = (name: string) =>
    exercises.status === "ready"
      ? exercises.data.find((e) => exerciseKey(e.name) === exerciseKey(name))
      : undefined;
  const measureOf = (item: Item) =>
    state.kind === "hangboard"
      ? gripMeasureOf(item.doses[0] ?? { sets: 1 })
      : doseMeasureOf(exerciseNamed(item.exercise));
  const nameOf = (exercise: string): string => {
    if (state.kind === "hangboard") return model.gripName(exercise);
    const own = exerciseNamed(exercise);
    return own === undefined ? exercise : exerciseLabel(own);
  };
  const save = (): void => {
    const saved = id ?? newId();
    void actions.saveWorkout(saved, draftOfEditor(state));
    if (id === undefined) void navigate(workoutPath(saved), { replace: true });
    else back();
  };

  return (
    <DetailFrame
      backTo="/app/train"
      backLabel={t("common.cancel")}
      onBack={state === initial ? undefined : () => setDiscarding(true)}
      footer={
        <button type="button" className="detail-primary" onClick={save}>
          {t("common.save")}
        </button>
      }
    >
      <span className="train-label form-mode">
        {id === undefined ? t("workouts.newWorkout") : t("hang.editWorkout")}
      </span>
      <input
        className="name-field"
        aria-label={t("hang.name")}
        value={state.name}
        maxLength={80}
        placeholder={t("workouts.namePlaceholder")}
        onChange={(e) => {
          const name = e.target.value;
          setState((s) => ({ ...s, name }));
        }}
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
      {state.items.map((item, i) => (
        <ItemEditor
          key={item.id ?? i}
          kind={state.kind}
          item={item}
          name={nameOf(item.exercise)}
          measure={measureOf(item)}
          unit={model.settings.units}
          onChange={(next) => setState((s) => withItem(s, i, next))}
          onRemove={() => setState((s) => withoutItem(s, i))}
          onSwap={() => setPicking({ swap: i })}
          {...(i > 0 && { onMoveUp: () => setState((s) => withItemMoved(s, i, i - 1)) })}
          {...(i < state.items.length - 1 && {
            onMoveDown: () => setState((s) => withItemMoved(s, i, i + 1)),
          })}
        />
      ))}
      <NumberField
        label={t("workouts.exerciseRest")}
        value={state.exerciseRestS}
        mode={{ kind: "time", max: 3600 }}
        onChange={(exerciseRestS) => setState((s) => ({ ...s, exerciseRestS }))}
      />
      <button
        type="button"
        className="outline-button outline-button--wide"
        onClick={() => setPicking("add")}
      >
        + {t("workouts.addExercises")}
      </button>
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
          kind={state.kind}
          items={state.items}
          multi={picking === "add"}
          onPick={(picked) =>
            setState((s) =>
              picking === "add"
                ? withItemsAdded(s, picked, newId)
                : withExerciseSwapped(s, picking.swap, picked[0] ?? { exercise: "" })
            )
          }
          onClose={() => setPicking(null)}
        />
      )}
      <Sheet
        open={discarding}
        title={t("workouts.discardChangesTitle")}
        onClose={() => setDiscarding(false)}
        action={{ label: t("common.discard"), danger: true, onPress: back }}
      />
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
