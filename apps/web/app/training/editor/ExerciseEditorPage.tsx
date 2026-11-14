import React from "react";
import { useNavigate } from "react-router";
import type { Exercise } from "@sendtally/api-client";
import { GRIP_MEASURES, type WorkoutKind } from "@sendtally/core/hang";
import {
  exerciseKindOf,
  measureChangeNeedsWarning,
  takenBy,
  useExerciseActions,
  type ExerciseForm,
} from "@sendtally/features/exercises";
import { renameClash } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useDiscardGuard } from "../../lib/useDiscardGuard";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { EXERCISES_VIEW, exercisePath } from "../exercises/paths";
import { ExerciseFields } from "./ExerciseFields";
import { newExerciseForm } from "./NewExerciseSheet";
import { useMake } from "./useMake";

type FormProps = {
  initial: ExerciseForm;
  editing: boolean;
  /** Sets are logged on it, so changing its measure warns first. */
  logged: boolean;
  /** Saves it; `release` lets the page go without asking, called once the save leaves. */
  onSave: (form: ExerciseForm, release: () => void) => void;
  /** A built-in's name, which stays as it is. */
  locked?: boolean;
  /** What is wrong with a name, if anything. */
  nameError?: (name: string) => string | undefined;
  children?: React.ReactNode;
};

function Form({
  initial,
  editing,
  logged,
  onSave,
  locked = false,
  nameError = () => undefined,
  children,
}: FormProps): React.ReactElement {
  const [untouched] = React.useState(initial);
  const [form, setForm] = React.useState(untouched);
  const [warning, setWarning] = React.useState(false);
  const guard = useDiscardGuard(form !== untouched);
  const trimmed = form.name.trim();
  const error = nameError(trimmed);
  const blocked = trimmed === "" || error !== undefined;
  const saved = { ...form, name: trimmed };
  const save = (): void => {
    if (blocked) return;
    if (measureChangeNeedsWarning(untouched.measure, form.measure, logged)) setWarning(true);
    else onSave(saved, guard.release);
  };
  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      backLabel={t("common.cancel")}
      footer={
        <button type="button" className="detail-primary" disabled={blocked} onClick={save}>
          {t("common.save")}
        </button>
      }
    >
      <span className="train-label form-mode">
        {editing ? t("workouts.editExercise") : t("workouts.newExercise")}
      </span>
      <ExerciseFields
        form={form}
        onChange={setForm}
        locked={locked ? t("workouts.builtInNameLocked") : undefined}
        error={error}
        autoFocus={!editing}
        onSubmit={save}
      />
      {guard.sheet}
      <Sheet
        open={warning}
        title={t("workouts.changeMeasureTitle", { name: trimmed })}
        onClose={() => setWarning(false)}
        action={{
          label: t("workouts.changeMeasure"),
          danger: true,
          onPress: () => onSave(saved, guard.release),
        }}
      >
        <p className="sheet-body">{t("workouts.changeMeasureBody")}</p>
      </Sheet>
      {children}
    </DetailFrame>
  );
}

function NewExercise({ kind, name }: { kind: WorkoutKind; name: string }): React.ReactElement {
  const make = useMake();
  const navigate = useNavigate();
  const back = useGoBack(EXERCISES_VIEW);
  const save = (form: ExerciseForm, release: () => void): void => {
    void make(form).then((made) => {
      if (made === null) return;
      release();
      if ("exercise" in made) void navigate(exercisePath(made.exercise.id), { replace: true });
      else back();
    });
  };
  return (
    <Form initial={newExerciseForm(kind, name)} editing={false} logged={false} onSave={save} />
  );
}

function EditExercise({
  exercise,
  logged,
}: {
  exercise: Exercise;
  logged: boolean;
}): React.ReactElement {
  const api = useAppApi();
  const back = useGoBack(EXERCISES_VIEW);
  const navigate = useNavigate();
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const actions = useExerciseActions(api, failed);
  const [taken, setTaken] = React.useState<{ into: Exercise; release: () => void } | null>(null);
  const save = (
    { name, kind, measure, eachSide, progress }: ExerciseForm,
    release: () => void
  ): void => {
    void api
      .saveExercise(exercise.id, {
        name,
        kind: exerciseKindOf(kind) ?? exercise.kind,
        measure: measure === "hang" ? exercise.measure : measure,
        eachSide,
        progress: progress ?? null,
      })
      .then(
        () => {
          void actions.refresh();
          release();
          back();
        },
        (error: unknown) => {
          const clash = takenBy(error);
          if (clash === undefined) failed();
          else setTaken({ into: clash, release });
        }
      );
  };
  return (
    <Form
      initial={{
        kind: exercise.kind,
        name: exercise.name,
        measure: exercise.measure,
        eachSide: exercise.eachSide,
        progress: exercise.progress,
      }}
      editing
      logged={logged}
      onSave={save}
    >
      <Sheet
        open={taken !== null}
        title={t("workouts.mergeExerciseTitle", {
          from: exercise.name,
          into: taken?.into.name ?? "",
        })}
        onClose={() => setTaken(null)}
        action={{
          label: t("workouts.merge"),
          danger: true,
          onPress: () => {
            if (taken === null) return;
            setTaken(null);
            void actions.merge(exercise, taken.into).then((done) => {
              if (!done) return;
              taken.release();
              void navigate(exercisePath(taken.into.id), { replace: true });
            });
          },
        }}
      >
        <p className="sheet-body">
          {t("workouts.mergeExerciseBody", {
            from: exercise.name,
            into: taken?.into.name ?? "",
          })}
        </p>
      </Sheet>
    </Form>
  );
}

function EditGrip({ id }: { id: string }): React.ReactElement | null {
  const { model, actions } = useHangData();
  const back = useGoBack(EXERCISES_VIEW);
  const grip = model.grips.find((g) => g.id === id);
  if (grip === undefined) return null;
  const measure = grip.measure ?? "hang";
  const save = (form: ExerciseForm, release: () => void): void => {
    release();
    back();
    const picked = GRIP_MEASURES.find((m) => m === form.measure) ?? measure;
    if (form.name !== grip.name || picked !== measure)
      void actions.saveGrip({ ...grip, name: form.name, measure: picked });
  };
  const nameError = (name: string): string | undefined => {
    const clash = renameClash(model.grips, grip.id, name);
    return clash === undefined ? undefined : t("hang.gripNameTaken", { name: clash.name });
  };
  return (
    <Form
      initial={{ kind: "hangboard", name: grip.name, measure, eachSide: false }}
      editing
      logged={model.sessions.some((s) => s.gripId === id)}
      onSave={save}
      locked={!grip.custom}
      nameError={nameError}
    />
  );
}

function EditOwn({ id }: { id: string }): React.ReactElement | null {
  const api = useAppApi();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const exercise = exercises.state.data.find((e) => e.id === id);
  if (exercise === undefined) return null;
  const logged =
    series.status === "ready" && series.data.some((s) => s.key === exerciseKey(exercise.name));
  return <EditExercise exercise={exercise} logged={logged} />;
}

export type ExerciseEditorPageProps =
  { making: WorkoutKind; name: string } | { exercise: string } | { grip: string };

/**
 * New exercise, or one edited: its name under its category, what its sets are measured in,
 * and whether it is done on each side. Fingers edits a grip, built-ins too, their names locked.
 */
export function ExerciseEditorPage(props: ExerciseEditorPageProps): React.ReactElement | null {
  if ("making" in props) return <NewExercise kind={props.making} name={props.name} />;
  if ("grip" in props) return <EditGrip id={props.grip} />;
  return <EditOwn id={props.exercise} />;
}
