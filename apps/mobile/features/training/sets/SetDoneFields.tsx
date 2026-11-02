import React from "react";
import { Text, View } from "react-native";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { KeypadField } from "../../../components/KeypadField";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder, type FieldSlot } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";
import { type } from "../type";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  /** A hangboard set: its hangs typed, its hang time read, as the timer measured it. */
  hangs?: boolean;
  /** Fell short of its target: the count it fell short on reads amber. */
  short?: boolean;
  /** In place of the hold field: ▶ to time it. */
  go?: React.ReactNode;
  /** Held less than its target: the hold reads amber. */
  holdShort?: boolean;
  /** Where a hang count sits in its table's column, so Next walks to the next set. */
  slot?: FieldSlot;
  /** A hang set's load, where Next walks after its count. */
  loadSlot?: FieldSlot;
  /** The load a hang set shows while it has none of its own: the session's. */
  defaultLoadKg?: number;
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
  hangs = false,
  short = false,
  slot: column,
  loadSlot,
  defaultLoadKg = 0,
  go,
  holdShort = false,
  onChange,
}: SetDoneFieldsProps): React.ReactElement {
  const reps = lifting || hangs || set.reps !== undefined;
  const weight = !hangs && (lifting || set.weightKg !== undefined);
  const hold = !hangs && set.onS !== undefined;
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
          {...(hangs && column !== undefined ? column : slot("reps"))}
          {...named(hangs ? t("plan.colHangs") : t("workouts.dose.reps"))}
          short={short}
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
      {hangs && <Joiner mark="×" />}
      {hangs && (
        <LoadValue
          slot={loadSlot}
          kg={set.weightKg ?? defaultLoadKg}
          unit={unit}
          {...named(t("hang.load"))}
          onChange={(weightKg) => onChange({ ...set, weightKg })}
        />
      )}
      {(reps || weight) && hold && <Joiner mark="·" />}
      {hold && go}
      {hold && go === undefined && (
        <TimeField
          {...slot("hold")}
          {...named(t("workouts.dose.hold"))}
          short={holdShort}
          value={set.onS ?? 0}
          onChange={(onS) => onChange({ ...set, onS })}
        />
      )}
    </View>
  );
}

/** A hang set's added load: "+10 lb", "−5 lb" assisted, "BW" at none. */
function LoadValue({
  slot,
  kg,
  unit,
  label,
  accessibilityLabel,
  onChange,
}: {
  slot: FieldSlot | undefined;
  kg: number;
  unit: WeightUnit;
  label: string;
  accessibilityLabel: string;
  onChange: (kg: number) => void;
}): React.ReactElement {
  const value = toUnit(kg, unit);
  const text =
    value === 0 ? t("hang.bw") : `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`;
  return (
    <KeypadField
      {...slot}
      label={label}
      accessibilityLabel={accessibilityLabel}
      compact
      mode={{
        kind: "number",
        unit,
        step: unit === "lb" ? 5 : 2.5,
        min: toUnit(-200, unit),
        max: toUnit(1000, unit),
        decimals: true,
        signed: true,
      }}
      value={value}
      text={["", text]}
      {...(value !== 0 && { unit })}
      onChange={(n) => onChange(fromUnit(n, unit))}
    />
  );
}
