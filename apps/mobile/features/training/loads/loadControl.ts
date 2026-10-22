import {
  bumpLoad,
  clampLoad,
  fromUnit,
  parseNumber,
  toUnit,
  type HangKind,
  type WeightUnit,
} from "@sendtally/core/hang";
import { formatNumber } from "@sendtally/features/i18n";
import { loadLabel } from "@sendtally/features/hang";

export type LoadControl = {
  text: string;
  label: string;
  commit: (text: string) => void;
  step: (direction: 1 | -1) => void;
};

/** Wires a − / input / + to a load kept in kg and shown in the chosen unit. */
export function loadControl(
  kind: HangKind,
  kg: number,
  unit: WeightUnit,
  set: (kg: number) => void
): LoadControl {
  return {
    text: formatNumber(toUnit(kg, unit), { useGrouping: false }),
    label: loadLabel(kind, kg, unit),
    commit: (text) => {
      const n = parseNumber(text);
      if (n !== null) set(clampLoad(kind, fromUnit(n, unit)));
    },
    step: (direction) => set(bumpLoad(kind, kg, unit, direction)),
  };
}
