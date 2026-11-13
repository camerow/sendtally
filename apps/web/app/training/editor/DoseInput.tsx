import React from "react";
import type { Dose, WeightUnit } from "@sendtally/core/hang";
import { fieldLimits, fieldValue, withField, type DoseField } from "@sendtally/features/workouts";
import { NumberField } from "../../components/NumberField";

export type DoseInputProps = {
  field: DoseField;
  dose: Dose;
  unit: WeightUnit;
  label: string;
  /** What an unset count or weight reads as. */
  placeholder?: string;
  onChange: (dose: Dose) => void;
};

/** One dose number: a length of time on a time field, else a count or weight. */
export function DoseInput({
  field,
  dose,
  unit,
  label,
  placeholder,
  onChange,
}: DoseInputProps): React.ReactElement {
  const set = (typed: number): void => onChange(withField(dose, field, typed, unit));
  return (
    <div className="dose-input">
      <NumberField
        label={label}
        value={
          field.measure === "time"
            ? (fieldValue(field, dose, unit) ?? 0)
            : fieldValue(field, dose, unit)
        }
        placeholder={placeholder}
        unit={field.measure === "weight" ? unit : undefined}
        mode={
          field.measure === "time"
            ? { kind: "time" }
            : { kind: "number", ...fieldLimits(field, unit) }
        }
        onChange={set}
      />
    </div>
  );
}
