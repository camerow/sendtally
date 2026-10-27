import React from "react";
import { Text, View } from "react-native";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
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

const field = {
  height: 36,
  fontSize: 14,
  borderWidth: 1,
  borderRadius: 8,
  borderColor: colors.lineOnLightStrong,
  backgroundColor: colors.white,
} as const;

const unitText = [type.mono, { fontSize: 13, color: colors.textSecondary }];

const parsed = (text: string): number | null => {
  const n = Number(text.replace(",", "."));
  return text.trim() === "" || !Number.isFinite(n) || n < 0 ? null : n;
};

/** What one set did, editable: its reps, weight and seconds, whichever the set has or lifting asks. */
export function SetDoneFields({
  set,
  lifting = false,
  unit,
  label,
  onChange,
}: SetDoneFieldsProps): React.ReactElement {
  const commit =
    (key: keyof SetDone, toKg = false) =>
    (text: string): void => {
      const n = parsed(text);
      if (n !== null) onChange({ ...set, [key]: toKg ? fromUnit(n, unit) : Math.round(n) });
    };
  const reps = lifting || set.reps !== undefined;
  const weight = lifting || set.weightKg !== undefined;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {reps && (
        <NumberField
          value={set.reps === undefined ? "" : formatNumber(set.reps)}
          onCommit={commit("reps")}
          label={`${label} · ${t("workouts.dose.reps")}`}
          keyboard="number-pad"
          style={[field, { width: 40 }]}
        />
      )}
      {reps && weight && <Text style={unitText}>×</Text>}
      {weight && (
        <>
          <NumberField
            value={set.weightKg === undefined ? "" : formatNumber(toUnit(set.weightKg, unit))}
            onCommit={commit("weightKg", true)}
            label={`${label} · ${t("hang.weight")}`}
            style={[field, { width: 52 }]}
          />
          <Text style={unitText}>{unit}</Text>
        </>
      )}
      {set.onS !== undefined && (
        <>
          <NumberField
            value={String(set.onS)}
            onCommit={commit("onS")}
            label={`${label} · ${t("workouts.dose.hold")}`}
            keyboard="number-pad"
            style={[field, { width: 48 }]}
          />
          <Text style={unitText}>s</Text>
        </>
      )}
    </View>
  );
}
