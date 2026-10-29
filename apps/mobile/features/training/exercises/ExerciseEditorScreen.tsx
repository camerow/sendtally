import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { defaultMeasure, measuresFor, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  exerciseKindOf,
  measureChangeNeedsWarning,
  measureLabel,
  tallyMeasureOf,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";
import { Switch } from "../../../components/Switch";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { pressRow } from "../../../lib/press";
import { ChipRow } from "../components/ChipRow";
import { EditorHeader } from "../components/EditorHeader";
import { KindNameField } from "../components/KindNameField";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { type } from "../type";
import { ItemEditor } from "../workout-editor/ItemEditor";
import { newDoseFor } from "../workout-editor/doseFields";
import { forgetOpener, openerOf } from "./openExerciseEditor";
import { ProgressChips } from "./ProgressChips";
import { takenBy } from "./takenBy";
import type { ExerciseForm } from "./types";

type Measure = ExerciseForm["measure"];
import { useMakeExercise } from "./useMakeExercise";
import { useMergeExercise } from "./useMergeExercise";

export type ExerciseEditorScreenProps = {
  /** The category it is made in; an edited exercise keeps its own. */
  kind: WorkoutKind;
  /** Edit this exercise of the user's own. */
  id?: string;
  /** A new exercise's name so far, from what was searched. */
  name?: string;
  /** The opener waiting for the form, from `openExerciseEditor`. */
  ret?: string;
};

type FormProps = {
  initial: ExerciseForm;
  editing: boolean;
  /** Sets are logged on it, so changing its measure warns first. */
  logged: boolean;
  onSave: (form: ExerciseForm) => void;
};

const ROW = {
  minHeight: 52,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.lineOnLightSoft,
} as const;

const noop = (): void => undefined;

function Form({ initial, editing, logged, onSave }: FormProps): React.ReactElement {
  const { model } = useHangData();
  const [untouched] = React.useState(initial);
  const [form, setForm] = React.useState(untouched);
  const [advanced, setAdvanced] = React.useState(false);
  const { kind } = form;
  const trimmed = form.name.trim();
  const fingers = kind === "hangboard";
  const climbing = kind === "climbing";
  const doseMeasure =
    (climbing && form.measure !== "hang"
      ? tallyMeasureOf({ kind, measure: form.measure })
      : null) ?? form.measure;
  const previewName = trimmed === "" ? t("workouts.exerciseNamePlaceholder") : trimmed;
  const progress = t(`workouts.progress.${form.progress ?? "completed"}`);

  const save = (): void => {
    if (trimmed === "") return;
    const saved = { ...form, name: trimmed };
    if (measureChangeNeedsWarning(untouched.measure, form.measure, logged))
      confirmDestructive({
        title: t("workouts.changeMeasureTitle", { name: trimmed }),
        body: t("workouts.changeMeasureBody"),
        action: t("workouts.changeMeasure"),
        onConfirm: () => onSave(saved),
      });
    else onSave(saved);
  };
  const cancel = (): void => {
    if (form === untouched) router.back();
    else
      confirmDestructive({
        title: t("workouts.discardChangesTitle"),
        action: t("common.discard"),
        onConfirm: () => router.back(),
      });
  };

  return (
    <ScreenFrame
      header={
        <EditorHeader
          title={editing ? t("workouts.editExercise") : t("workouts.newExercise")}
          onCancel={cancel}
          onSave={save}
          saveDisabled={trimmed === ""}
        />
      }
    >
      <KindNameField
        kind={kind}
        value={form.name}
        onChange={(name) => setForm((f) => ({ ...f, name }))}
        onSubmit={save}
        placeholder={t("workouts.exerciseNamePlaceholder")}
        maxLength={fingers ? 40 : 80}
        autoFocus={!editing}
      />
      <SheetSection label={t("workouts.measuredIn")}>
        <ChipRow<Measure>
          value={form.measure}
          onChange={(measure) => setForm((f) => ({ ...f, measure }))}
          options={measuresFor(kind).map((m) => ({ value: m, label: measureLabel(m, kind) }))}
        />
      </SheetSection>
      {!fingers && !climbing && (
        <View style={ROW}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.body, { fontSize: 15, color: colors.gunmetal }]}>
              {t("workouts.eachSide")}
            </Text>
            <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
              {t("workouts.eachSideHint")}
            </Text>
          </View>
          <Switch
            checked={form.eachSide}
            onChange={(eachSide) => setForm((f) => ({ ...f, eachSide }))}
            disabled={false}
            label={t("workouts.eachSide")}
          />
        </View>
      )}
      {climbing && (
        <Pressable
          onPress={() => setAdvanced((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: advanced }}
          style={pressRow(ROW)}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.body, { fontSize: 15, color: colors.gunmetal }]}>
              {t("workouts.advanced")}
            </Text>
            {!advanced && (
              <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
                {`${t("workouts.progress")}: ${progress}`}
              </Text>
            )}
          </View>
          <View style={{ transform: [{ rotate: advanced ? "-90deg" : "90deg" }] }}>
            <Icon name="chevron" color={colors.textSecondary} size={18} strokeWidth={2} />
          </View>
        </Pressable>
      )}
      {climbing && advanced && (
        <ProgressChips
          value={form.progress ?? null}
          onChange={(progress) => setForm((f) => ({ ...f, progress }))}
        />
      )}
      <SheetSection label={t("workouts.preview")}>
        <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
          {t("workouts.previewHint")}
        </Text>
        <View accessible pointerEvents="none">
          <ItemEditor
            kind={kind}
            item={{ exercise: previewName, doses: [newDoseFor(kind, doseMeasure)] }}
            name={form.eachSide ? `${previewName} · ${t("activities.eachSide")}` : previewName}
            measure={doseMeasure}
            unit={model.settings.units}
            onChange={noop}
            onRemove={noop}
            onSwap={noop}
          />
        </View>
      </SheetSection>
    </ScreenFrame>
  );
}

function NewExercise({ kind, name = "", ret }: ExerciseEditorScreenProps): React.ReactElement {
  const make = useMakeExercise();
  React.useEffect(() => () => forgetOpener(ret), [ret]);
  const initial: ExerciseForm = {
    kind,
    name,
    measure: kind === "hangboard" ? "hang" : defaultMeasure(exerciseKindOf(kind) ?? "other"),
    eachSide: false,
  };
  const save = (form: ExerciseForm): void => {
    const opener = openerOf(ret);
    if (opener !== undefined) {
      router.back();
      opener(form);
      return;
    }
    void make(form).then((made) => {
      if (made === null) return;
      if ("exercise" in made)
        router.replace({ pathname: "/exercise/[id]", params: { id: made.exercise.id } });
      else router.back();
    });
  };
  return <Form initial={initial} editing={false} logged={false} onSave={save} />;
}

function EditExercise({ id }: { id: string }): React.ReactElement | null {
  const api = useApi();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const merge = useMergeExercise();
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const exercise = exercises.state.data.find((e) => e.id === id);
  if (exercise === undefined) return null;
  const logged =
    series.status === "ready" && series.data.some((s) => s.key === exerciseKey(exercise.name));

  const save = ({ name, kind, measure, eachSide, progress }: ExerciseForm): void => {
    router.back();
    void api
      .saveExercise(exercise.id, {
        name,
        kind: exerciseKindOf(kind) ?? exercise.kind,
        measure: measure === "hang" ? exercise.measure : measure,
        eachSide,
        progress: progress ?? null,
      })
      .catch((error: unknown) => {
        const taken = takenBy(error);
        if (taken === undefined) Alert.alert(t("workouts.saveFailed"));
        else merge(exercise, taken);
      });
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
    />
  );
}

/**
 * New exercise, or one edited: its name under its category, what its sets are measured in,
 * and whether it is done on each side. The category comes from where it was opened. Fingers
 * hangs on an edge or pulls off the ground, by reps or time; climbing logs on the session
 * tally, in climbs or time on the wall, never by side.
 */
export function ExerciseEditorScreen(props: ExerciseEditorScreenProps): React.ReactElement | null {
  return props.id === undefined ? <NewExercise {...props} /> : <EditExercise id={props.id} />;
}
