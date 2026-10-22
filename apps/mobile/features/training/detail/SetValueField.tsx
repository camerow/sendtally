import React from "react";
import { fromUnit, parseNumber, toUnit, type WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { formatNumber } from "@sendtally/features/i18n";
import { NumberField } from "../components/NumberField";

export type NumberMeasure = "reps" | "loadKg" | "seconds";

export type SetValueFieldProps = {
  measure: NumberMeasure;
  value: number | undefined;
  unit: WeightUnit;
  label: string;
  inSheet: boolean;
  onChange: (value: number | undefined) => void;
};

const LIMITS: Record<NumberMeasure, [number, number]> = {
  reps: [0, 1000],
  loadKg: [-200, 1000],
  seconds: [0, 86400],
};

const clamp = (measure: NumberMeasure, n: number): number => {
  const [min, max] = LIMITS[measure];
  return Math.min(max, Math.max(min, n));
};

/** One number in a set, typed in the user's weight unit for a load and kept in kg; empty clears it. */
export function SetValueField({
  measure,
  value,
  unit,
  label,
  inSheet,
  onChange,
}: SetValueFieldProps): React.ReactElement {
  const load = measure === "loadKg";
  const shown = value === undefined ? undefined : load ? toUnit(value, unit) : value;
  const commit = (text: string): void => {
    if (text.trim() === "") return onChange(undefined);
    const n = parseNumber(text);
    if (n === null) return;
    onChange(clamp(measure, load ? fromUnit(n, unit) : Math.round(n)));
  };
  return (
    <NumberField
      value={shown === undefined ? "" : formatNumber(shown, { useGrouping: false })}
      onCommit={commit}
      label={label}
      placeholder={load ? unit : undefined}
      keyboard={load ? "decimal-pad" : "number-pad"}
      inSheet={inSheet}
      style={{
        flex: 1,
        minWidth: 0,
        height: 44,
        fontSize: 15,
        color: colors.gunmetal,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        borderRadius: radius.control,
      }}
    />
  );
}
