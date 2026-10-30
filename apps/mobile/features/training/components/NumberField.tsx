import React from "react";
import type { NumberLimits } from "@sendtally/core/hang";
import { formatNumber } from "@sendtally/features/i18n";
import { KeypadField, type KeypadFieldProps } from "../../../components/KeypadField";
import type { FieldSlot } from "../../../components/useFieldOrder";

export type NumberFieldProps = FieldSlot &
  NumberLimits &
  Pick<KeypadFieldProps, "label" | "accessibilityLabel" | "before" | "after"> & {
    /** Null reads as the placeholder, and the keypad opens on zero. */
    value: number | null;
    /** Called on Done, Next or a tap outside, only when it changed. */
    onChange: (value: number) => void;
    placeholder?: string;
    unit?: string;
  };

/** A count or weight typed on the in-app keypad, stepped by its keypad's ± key. */
export function NumberField({
  value,
  placeholder = "–",
  unit,
  step,
  min,
  max,
  decimals,
  signed,
  ...field
}: NumberFieldProps): React.ReactElement {
  return (
    <KeypadField
      {...field}
      mode={{ kind: "number", unit, step, min, max, decimals, signed }}
      value={value ?? 0}
      text={value === null ? [placeholder, ""] : ["", formatNumber(value).replace("-", "−")]}
      unit={unit}
    />
  );
}
