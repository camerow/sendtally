import React from "react";
import { View } from "react-native";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  onChange: (set: SetDone) => void;
};

const cell = { flexGrow: 1, minWidth: 64 } as const;

/**
 * What one set did, editable: its reps, weight and hold, whichever the set has or lifting asks.
 * A negative weight is assistance.
 */
export function SetDoneFields({
  set,
  lifting = false,
  unit,
  label,
  onChange,
}: SetDoneFieldsProps): React.ReactElement {
  const reps = lifting || set.reps !== undefined;
  const weight = lifting || set.weightKg !== undefined;
  const hold = set.onS !== undefined;
  const { slot } = useFieldOrder([
    ...(reps ? ["reps"] : []),
    ...(weight ? ["weight"] : []),
    ...(hold ? ["hold"] : []),
  ]);
  const named = (name: string): { label: string; accessibilityLabel: string } => ({
    label: name,
    accessibilityLabel: `${label} · ${name}`,
  });
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {reps && (
        <View style={cell}>
          <NumberField
            {...slot("reps")}
            {...named(t("workouts.dose.reps"))}
            value={set.reps ?? null}
            onChange={(n) => onChange({ ...set, reps: n })}
            step={1}
            max={1000}
          />
        </View>
      )}
      {weight && (
        <View style={[cell, { minWidth: 88 }]}>
          <NumberField
            {...slot("weight")}
            {...named(t("hang.weight"))}
            value={set.weightKg === undefined ? null : toUnit(set.weightKg, unit)}
            onChange={(n) => onChange({ ...set, weightKg: fromUnit(n, unit) })}
            unit={unit}
            step={unit === "lb" ? 5 : 2.5}
            min={toUnit(-200, unit)}
            max={toUnit(1000, unit)}
            decimals
            signed
          />
        </View>
      )}
      {hold && (
        <View style={[cell, { minWidth: 108 }]}>
          <TimeField
            {...slot("hold")}
            {...named(t("workouts.dose.hold"))}
            value={set.onS ?? 0}
            onChange={(onS) => onChange({ ...set, onS })}
          />
        </View>
      )}
    </View>
  );
}
