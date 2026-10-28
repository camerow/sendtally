import React from "react";
import { View } from "react-native";
import type { Dose, WeightUnit } from "@sendtally/core/hang";
import { TimeField } from "../../../components/TimeField";
import type { FieldSlot } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";
import { fieldLimits, fieldValue, withField, type DoseField } from "./doseFields";

export type DoseInputProps = FieldSlot & {
  field: DoseField;
  dose: Dose;
  unit: WeightUnit;
  label: string;
  /** What a screen reader and the keypad call it, when the label alone is not enough. */
  accessibilityLabel: string;
  /** What an unset count or weight reads as. */
  placeholder?: string;
  onChange: (dose: Dose) => void;
};

/** One dose number: a length of time on a time field, else a count or weight. */
export function DoseInput({
  field,
  dose,
  unit,
  placeholder,
  onChange,
  ...rest
}: DoseInputProps): React.ReactElement {
  const value = fieldValue(field, dose, unit);
  const set = (typed: number): void => onChange(withField(dose, field, typed, unit));
  return (
    <View style={{ flexGrow: 1, flexBasis: "40%" }}>
      {field.measure === "time" ? (
        <TimeField {...rest} value={value ?? 0} onChange={set} />
      ) : (
        <NumberField
          {...rest}
          {...fieldLimits(field, unit)}
          value={value}
          onChange={set}
          placeholder={placeholder}
          unit={field.measure === "weight" ? unit : undefined}
        />
      )}
    </View>
  );
}
