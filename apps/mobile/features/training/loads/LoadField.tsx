import React from "react";
import { View } from "react-native";
import {
  clampLoad,
  fromUnit,
  loadStep,
  toUnit,
  type HangKind,
  type WeightUnit,
} from "@sendtally/core/hang";
import { NumberField } from "../components/NumberField";
import type { FieldSlot } from "../../../components/useFieldOrder";

export type LoadFieldProps = FieldSlot & {
  kind: HangKind;
  kg: number;
  unit: WeightUnit;
  label: string;
  onChange: (kg: number) => void;
  children?: React.ReactNode;
};

/** A load kept in kg, typed in the chosen unit; a hang's can be negative, which is assistance. */
export function LoadField({
  kind,
  kg,
  unit,
  label,
  onChange,
  children,
  ...slot
}: LoadFieldProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <NumberField
        {...slot}
        label={label}
        value={toUnit(kg, unit)}
        onChange={(n) => onChange(clampLoad(kind, fromUnit(n, unit)))}
        unit={unit}
        step={loadStep(kind, unit)}
        decimals
        signed={kind === "hang"}
      />
      {children}
    </View>
  );
}
