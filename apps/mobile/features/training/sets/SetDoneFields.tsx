import React from "react";
import { Text, View } from "react-native";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";
import { type } from "../type";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  onChange: (set: SetDone) => void;
};

function Joiner({ mark }: { mark: string }): React.ReactElement {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[type.mono, { fontSize: 13, color: colors.textMuted }]}
    >
      {mark}
    </Text>
  );
}

/**
 * What one set did, editable on one line in its target's order: reps × weight · hold, whichever
 * the set has or lifting asks. A negative weight is assistance.
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
  const named = (name: string): { label: string; accessibilityLabel: string; compact: true } => ({
    label: name,
    accessibilityLabel: `${label} · ${name}`,
    compact: true,
  });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      {reps && (
        <NumberField
          {...slot("reps")}
          {...named(t("workouts.dose.reps"))}
          value={set.reps ?? null}
          onChange={(n) => onChange({ ...set, reps: n })}
          step={1}
          max={1000}
        />
      )}
      {reps && weight && <Joiner mark="×" />}
      {weight && (
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
      )}
      {(reps || weight) && hold && <Joiner mark="·" />}
      {hold && (
        <TimeField
          {...slot("hold")}
          {...named(t("workouts.dose.hold"))}
          value={set.onS ?? 0}
          onChange={(onS) => onChange({ ...set, onS })}
        />
      )}
    </View>
  );
}
