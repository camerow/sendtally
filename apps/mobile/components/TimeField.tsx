import React from "react";
import { openTime, timeText } from "@sendtally/core/hang";
import { KeypadField } from "./KeypadField";
import type { FieldSlot } from "./useFieldOrder";

export type TimeFieldProps = FieldSlot & {
  label: string;
  accessibilityLabel?: string;
  /** Seconds. */
  value: number;
  /** Called with the new length on Done, Next or a tap outside, only when it changed. */
  onChange: (seconds: number) => void;
  min?: number;
  max?: number;
};

/** A length of time read as HH:MM:SS with its leading zeros dimmed, typed on the in-app keypad. */
export function TimeField({ value, min, max, ...field }: TimeFieldProps): React.ReactElement {
  return (
    <KeypadField
      {...field}
      mode={{ kind: "time", min, max }}
      value={value}
      text={timeText(openTime(value, { min, max }))}
    />
  );
}
