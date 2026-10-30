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
import { t } from "@sendtally/features/i18n";
import { Stepper } from "../components/Stepper";
import type { FieldSlot } from "../../../components/useFieldOrder";

export type LoadFieldProps = FieldSlot & {
  kind: HangKind;
  kg: number;
  unit: WeightUnit;
  label: string;
  onChange: (kg: number) => void;
  children?: React.ReactNode;
};

/** A load kept in kg, typed or stepped in the chosen unit; a hang's can be negative, which is assistance. */
export function LoadField({
  kind,
  kg,
  unit,
  label,
  onChange,
  children,
  ...slot
}: LoadFieldProps): React.ReactElement {
  const step = loadStep(kind, unit);
  const set = (n: number): void => onChange(clampLoad(kind, fromUnit(n, unit)));
  return (
    <View style={{ gap: 8 }}>
      <Stepper
        {...slot}
        label={label}
        value={toUnit(kg, unit)}
        onChange={set}
        onStep={(direction) => set(toUnit(kg, unit) + direction * step)}
        unit={unit}
        step={step}
        decimals
        signed={kind === "hang"}
        decreaseLabel={t("hang.decrease", { field: label })}
        increaseLabel={t("hang.increase", { field: label })}
        surface="plain"
      />
      {children}
    </View>
  );
}
