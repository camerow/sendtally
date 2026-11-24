import React from "react";
import { EXERCISE_KINDS, type WeightUnit } from "@sendtally/core/hang";
import { measureLabel } from "@sendtally/features/exercises";
import { categoryLabel } from "@sendtally/features/library";
import { doseMeasureOf, newDoseFor } from "@sendtally/features/workouts";
import { chipStyle } from "../../components/chip";
import { SwitchField } from "../../components/Switch";
import { ItemEditor } from "../../training/editor/ItemEditor";
import { exerciseMeasures, withExerciseKind, type ExerciseSpecDraft } from "../libraryDraft";

export type ExerciseSpecFieldsProps = {
  draft: ExerciseSpecDraft;
  name: string;
  unit: WeightUnit;
  onChange: (draft: ExerciseSpecDraft) => void;
};

/** A new built-in exercise's category, its measure, and the dose a workout item of it starts at. */
export function ExerciseSpecFields({
  draft,
  name,
  unit,
  onChange,
}: ExerciseSpecFieldsProps): React.ReactElement {
  const { kind, measure, dose } = draft;
  const doseMeasure = doseMeasureOf({ kind, measure });
  return (
    <>
      <div className="form-section">
        <span className="train-label">Category</span>
        <div className="setup-chips" role="radiogroup" aria-label="Category">
          {EXERCISE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              style={chipStyle(kind === k, { minHeight: 40 })}
              onClick={() => onChange(withExerciseKind(draft, k))}
            >
              {categoryLabel(k)}
            </button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <span className="train-label">Measured in</span>
        <div className="setup-chips" role="radiogroup" aria-label="Measured in">
          {exerciseMeasures(kind).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={measure === m}
              style={chipStyle(measure === m, { minHeight: 40 })}
              onClick={() => onChange({ ...draft, measure: m, dose: null })}
            >
              {measureLabel(m, kind)}
            </button>
          ))}
        </div>
      </div>
      <SwitchField
        label="Own starting dose"
        hint="Only when the measure's usual start is wrong for it, such as one set."
        checked={dose !== null}
        onChange={(on) => onChange({ ...draft, dose: on ? newDoseFor(kind, doseMeasure) : null })}
      />
      <div className={dose === null ? "exercise-preview" : undefined}>
        <ItemEditor
          kind={kind}
          item={{ exercise: name, doses: [dose ?? newDoseFor(kind, doseMeasure)] }}
          name={name}
          measure={doseMeasure}
          unit={unit}
          onChange={(item) => onChange({ ...draft, dose: item.doses[0] ?? null })}
          onRemove={() => onChange({ ...draft, dose: null })}
          preview={dose === null}
          compact
          single
        />
      </div>
    </>
  );
}
