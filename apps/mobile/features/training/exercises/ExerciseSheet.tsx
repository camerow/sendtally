import React from "react";
import { Text, View } from "react-native";
import {
  defaultMeasure,
  EXERCISE_MEASURES,
  WORKOUT_KINDS,
  type ExerciseMeasure,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import {
  exerciseKindOf,
  measureChangeNeedsWarning,
  measureLabel,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { Switch } from "../../../components/Switch";
import { TextInput } from "../../../components/TextInput";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { Button } from "../components/Button";
import { ChipRow } from "../components/ChipRow";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { HangSheet } from "../data/HangSheet";
import { KIND_COLORS } from "../insights/kindColors";
import { type } from "../type";
import type { ExerciseForm } from "./types";

export type ExerciseSheetProps = {
  /** A new exercise's category and name, or the exercise being edited. */
  initial: Pick<ExerciseForm, "kind" | "name"> & Partial<ExerciseForm>;
  /** Editing one of the user's exercises: Fingers is not offered, and a logged one warns before its measure changes. */
  editing?: { logged: boolean };
  onSave: (form: ExerciseForm) => void;
  onClose: () => void;
};

const measureOrDefault = (kind: WorkoutKind): ExerciseMeasure =>
  defaultMeasure(exerciseKindOf(kind) ?? "other");

/**
 * New exercise, or one edited: its category, its name, what its sets are measured in and
 * whether it is done on each side. Fingers is fixed to hang time and added weight on an edge.
 */
export function ExerciseSheet({
  initial,
  editing,
  onSave,
  onClose,
}: ExerciseSheetProps): React.ReactElement {
  const [form, setForm] = React.useState<ExerciseForm>({
    measure: measureOrDefault(initial.kind),
    eachSide: false,
    ...initial,
  });
  const [measureTouched, setMeasureTouched] = React.useState(initial.measure !== undefined);
  const trimmed = form.name.trim();
  const fingers = form.kind === "hangboard";
  const kinds =
    editing === undefined ? WORKOUT_KINDS : WORKOUT_KINDS.filter((k) => k !== "hangboard");

  const setKind = (kind: WorkoutKind): void =>
    setForm((f) => ({ ...f, kind, measure: measureTouched ? f.measure : measureOrDefault(kind) }));
  const save = (): void => {
    if (trimmed === "") return;
    const saved = { ...form, name: trimmed };
    const done = (): void => {
      onClose();
      onSave(saved);
    };
    if (
      measureChangeNeedsWarning(
        initial.measure ?? form.measure,
        form.measure,
        editing?.logged ?? false
      )
    )
      confirmDestructive({
        title: t("workouts.changeMeasureTitle", { name: trimmed }),
        body: t("workouts.changeMeasureBody"),
        action: t("workouts.changeMeasure"),
        onConfirm: done,
      });
    else done();
  };

  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("plan.tabExercises")}
          title={editing === undefined ? t("workouts.newExercise") : t("workouts.editExercise")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <SheetSection label={t("workouts.category")}>
          <ChipRow<WorkoutKind>
            value={form.kind}
            onChange={setKind}
            options={kinds.map((k) => ({ value: k, label: kindLabel(k), mark: KIND_COLORS[k] }))}
          />
        </SheetSection>
        <SheetSection label={t("hang.name")}>
          <TextInput
            value={form.name}
            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
            onSubmitEditing={save}
            accessibilityLabel={t("hang.name")}
            returnKeyType="done"
            maxLength={fingers ? 40 : 80}
            autoFocus={editing === undefined}
            style={[
              type.bodyBold,
              {
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 16,
                color: colors.gunmetal,
                borderWidth: 1,
                borderColor: colors.lineOnLightStrong,
              },
            ]}
          />
        </SheetSection>
        <SheetSection label={t("workouts.measuredIn")}>
          {fingers ? (
            <Text style={[type.body, { fontSize: 15, color: colors.gunmetal }]}>
              {t("workouts.measureFingers")}
            </Text>
          ) : (
            <>
              <ChipRow<ExerciseMeasure>
                value={form.measure}
                onChange={(measure) => {
                  setMeasureTouched(true);
                  setForm((f) => ({ ...f, measure }));
                }}
                options={EXERCISE_MEASURES.map((m) => ({ value: m, label: measureLabel(m) }))}
              />
              <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
                {t("workouts.measuredInHint")}
              </Text>
            </>
          )}
        </SheetSection>
        {!fingers && (
          <View
            style={{
              minHeight: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.lineOnLightSoft,
            }}
          >
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
        <Button
          label={t("hang.save")}
          onPress={save}
          variant="primary"
          height={54}
          disabled={trimmed === ""}
        />
      </View>
    </HangSheet>
  );
}
