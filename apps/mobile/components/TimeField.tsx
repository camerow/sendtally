import React from "react";
import { openTime, timeText } from "@sendtally/core/hang";
import { KeypadField } from "./KeypadField";
import type { FieldSlot } from "./useFieldOrder";

export type TimeFieldProps = FieldSlot & {
  label: string;
  compact?: boolean;
  /** Amber: less than was asked. */
  short?: boolean;
  accessibilityLabel?: string;
  /** Seconds. */
  value: number;
  /** Called with the new length on Done, Next or a tap outside, only when it changed. */
  onChange: (seconds: number) => void;
  min?: number;
  max?: number;
  /** Dimmed in the box while the value is zero, such as an estimate. */
  placeholder?: string;
};

/** A length of time read as HH:MM:SS with its leading zeros dimmed, typed on the in-app keypad. */
export function TimeField({
  value,
  min,
  max,
  placeholder,
  ...field
}: TimeFieldProps): React.ReactElement {
  return (
    <KeypadField
      {...field}
      mode={{ kind: "time", min, max }}
      value={value}
      text={
        placeholder !== undefined && value === 0
          ? [placeholder, ""]
          : timeText(openTime(value, { min, max }))
      }
    />
  );
}
