import React from "react";
import { rangeText, type NumberLimits } from "@sendtally/core/hang";
import { formatNumber } from "@sendtally/features/i18n";
import { KeypadField, type KeypadFieldProps } from "../../../components/KeypadField";
import type { FieldSlot } from "../../../components/useFieldOrder";

export type NumberFieldProps = FieldSlot &
  NumberLimits &
  Pick<
    KeypadFieldProps,
    "label" | "compact" | "short" | "accessibilityLabel" | "before" | "after"
  > & {
    /** Null reads as the placeholder, and the keypad opens on zero. */
    value: number | null;
    /** Called on Done, Next or a tap outside, only when it changed. A range's top comes with it. */
    onChange: (value: number, max?: number) => void;
    /** A count that may run to a top, typed with To; the top it has now. */
    range?: { max?: number };
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
  range,
  ...field
}: NumberFieldProps): React.ReactElement {
  const shown =
    value === null
      ? null
      : range === undefined
        ? formatNumber(value).replace("-", "−")
        : rangeText({ min: value, max: range.max });
  return (
    <KeypadField
      {...field}
      mode={{ kind: "number", unit, step, min, max, decimals, signed, range }}
      value={value ?? 0}
      text={shown === null ? [placeholder, ""] : ["", shown]}
      unit={unit}
    />
  );
}
