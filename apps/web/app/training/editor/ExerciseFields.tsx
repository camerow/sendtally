import React from "react";
import { EXERCISE_PROGRESS, measuresFor } from "@sendtally/core/hang";
import { measureLabel, tallyMeasureOf, type ExerciseForm } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { newDoseFor } from "@sendtally/features/workouts";
import { chipStyle } from "../../components/chip";
import { SwitchField } from "../../components/Switch";
import { Icon } from "../../components/Icon";
import { useHangData } from "../data/HangDataContext";
import { ItemEditor } from "./ItemEditor";

export type ExerciseFieldsProps = {
  form: ExerciseForm;
  onChange: (form: ExerciseForm) => void;
  /** Why the name cannot change, such as a built-in's. */
  locked?: string;
  /** What is wrong with the name, if anything. */
  error?: string;
  autoFocus?: boolean;
  onSubmit: () => void;
};

const noop = (): void => undefined;

/**
 * An exercise's name under its category, what its sets are measured in, whether it is done on
 * each side, what a climbing exercise's trend follows, and a preview of its card in a workout.
 */
export function ExerciseFields({
  form,
  onChange,
  locked,
  error,
  autoFocus = false,
  onSubmit,
}: ExerciseFieldsProps): React.ReactElement {
  const { model } = useHangData();
  const [advanced, setAdvanced] = React.useState(false);
  const { kind } = form;
  const fingers = kind === "hangboard";
  const climbing = kind === "climbing";
  const trimmed = form.name.trim();
  const doseMeasure =
    (climbing && form.measure !== "hang"
      ? tallyMeasureOf({ kind, measure: form.measure })
      : null) ?? form.measure;
  const previewName = trimmed === "" ? t("workouts.exerciseNamePlaceholder") : trimmed;
  const progress = form.progress ?? "completed";
  const set = (patch: Partial<ExerciseForm>): void => onChange({ ...form, ...patch });

  return (
    <>
      <div className="form-section">
        <input
          className="name-field"
          aria-label={t("hang.name")}
          value={form.name}
          maxLength={fingers ? 40 : 80}
          placeholder={t("workouts.exerciseNamePlaceholder")}
          readOnly={locked !== undefined}
          autoFocus={autoFocus}
          onChange={(e) => set({ name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
        />
        {locked !== undefined && (
          <span className="name-locked">
            <Icon name="lock" size={14} strokeWidth={1.8} />
            {locked}
          </span>
        )}
        {error !== undefined && <span className="name-error">{error}</span>}
      </div>
      <div className="form-section">
        <span className="train-label">{t("workouts.measuredIn")}</span>
        <div className="setup-chips" role="radiogroup" aria-label={t("workouts.measuredIn")}>
          {measuresFor(kind).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={form.measure === m}
              style={chipStyle(form.measure === m, { minHeight: 40 })}
              onClick={() => set({ measure: m })}
            >
              {measureLabel(m, kind)}
            </button>
          ))}
        </div>
      </div>
      {!fingers && !climbing && (
        <SwitchField
          label={t("workouts.eachSide")}
          hint={t("workouts.eachSideHint")}
          checked={form.eachSide}
          onChange={(eachSide) => set({ eachSide })}
        />
      )}
      {climbing && (
        <button
          type="button"
          className="toggle-row disclosure"
          aria-expanded={advanced}
          onClick={() => setAdvanced((open) => !open)}
        >
          <span className="toggle-text">
            <span>{t("workouts.advanced")}</span>
            {!advanced && (
              <span className="form-hint">
                {t("workouts.progressIs", { pick: t(`workouts.progress.${progress}`) })}
              </span>
            )}
          </span>
          <span
            className={
              advanced ? "disclosure-chevron disclosure-chevron--open" : "disclosure-chevron"
            }
          >
            <Icon name="chevron" size={18} strokeWidth={2} />
          </span>
        </button>
      )}
      {climbing && advanced && (
        <div className="form-section">
          <span className="train-label">{t("workouts.progress")}</span>
          <div className="setup-chips" role="radiogroup" aria-label={t("workouts.progress")}>
            {EXERCISE_PROGRESS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={progress === p}
                style={chipStyle(progress === p, { minHeight: 40 })}
                onClick={() => set({ progress: p })}
              >
                {t(`workouts.progress.${p}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="form-section">
        <span className="train-label">{t("workouts.preview")}</span>
        <p className="form-hint">{t("workouts.previewHint")}</p>
        <div className="exercise-preview">
          <ItemEditor
            kind={kind}
            item={{ exercise: previewName, doses: [newDoseFor(kind, doseMeasure)] }}
            name={form.eachSide ? `${previewName} · ${t("activities.eachSide")}` : previewName}
            measure={doseMeasure}
            unit={model.settings.units}
            onChange={noop}
            onRemove={noop}
            onSwap={noop}
            preview
          />
        </div>
      </div>
    </>
  );
}
