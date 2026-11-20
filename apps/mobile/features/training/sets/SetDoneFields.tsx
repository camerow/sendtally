import React from "react";
import { hangLoadValue } from "@sendtally/features/hang";
import { Text, View } from "react-native";
import { fromUnit, toUnit, type SetDone, type WeightUnit, loadStep } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { KeypadField } from "../../../components/KeypadField";
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder, type FieldSlot } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  /** A hangboard set: its hangs typed, its hang time read, as the timer measured it. */
  hangs?: boolean;
  /** A hangboard set of one hang: its count field is the time held, empty when it did not hold. */
  oneHang?: boolean;
  /** In place of the hold field: ▶ to time it. */
  go?: React.ReactNode;
  /** Where a hang count sits in its table's column, so Next walks to the next set. */
  slot?: FieldSlot;
  /** A hang set's load, where Next walks after its count. */
  loadSlot?: FieldSlot;
  /** The load a hang set shows while it has none of its own: the session's. */
  defaultLoadKg?: number;
  onChange: (set: SetDone) => void;
};

/** A set's hold or time held reads MM:SS, so it stays under an hour. */
const SET_TIME_MAX = 3599;

function Joiner({ mark }: { mark: string }): React.ReactElement {
  return (
    <View style={SET_COLUMNS.join}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[type.mono, { fontSize: 13, color: colors.textMuted }]}
      >
        {mark}
      </Text>
    </View>
  );
}

/**
 * What one set did, editable on one line of the set grid: the count, then the measure (weight,
 * hold or a hang's load), each filling its column; a lone field takes the whole row. A negative
 * weight is assistance.
 */
export function SetDoneFields({
  set,
  lifting = false,
  unit,
  label,
  hangs = false,
  oneHang = false,
  slot: column,
  loadSlot,
  defaultLoadKg = 0,
  go,
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
  const named = (
    name: string
  ): { label: string; accessibilityLabel: string; compact: true; fill: true } => ({
    label: name,
    accessibilityLabel: `${label} · ${name}`,
    compact: true,
    fill: true,
  });
  const fields: { key: string; mark: string; field: React.ReactElement }[] = [
    ...(reps
      ? [
          {
            key: "reps",
            mark: "",
            field: oneHang ? (
              <TimeField
                {...(column ?? slot("reps"))}
                {...named(t("plan.colHeld"))}
                placeholder="–"
                max={SET_TIME_MAX}
                value={set.reps === 0 ? 0 : (set.onS ?? 0)}
                onChange={(onS) => onChange({ ...set, reps: onS > 0 ? 1 : 0, onS })}
              />
            ) : (
              <NumberField
                {...(hangs && column !== undefined ? column : slot("reps"))}
                {...named(hangs ? t("plan.colHangs") : t("workouts.dose.reps"))}
                value={hangs && set.reps === 0 ? null : (set.reps ?? null)}
                onChange={(n) => onChange({ ...set, reps: n })}
                step={1}
                max={1000}
              />
            ),
          },
        ]
      : []),
    ...(weight
      ? [
          {
            key: "weight",
            mark: "×",
            field: (
              <NumberField
                {...slot("weight")}
                {...named(t("hang.weight"))}
                value={set.weightKg === undefined ? null : toUnit(set.weightKg, unit)}
                onChange={(n) => onChange({ ...set, weightKg: fromUnit(n, unit) })}
                unit={unit}
                step={loadStep("pull", unit)}
                min={toUnit(-200, unit)}
                max={toUnit(1000, unit)}
                decimals
                signed
              />
            ),
          },
        ]
      : []),
    ...(hangs
      ? [
          {
            key: "load",
            mark: "×",
            field: (
              <LoadValue
                slot={loadSlot}
                kg={set.weightKg ?? defaultLoadKg}
                unit={unit}
                {...named(t("hang.load"))}
                onChange={(weightKg) => onChange({ ...set, weightKg })}
              />
            ),
          },
        ]
      : []),
    ...(hold
      ? [
          {
            key: "hold",
            mark: "·",
            field:
              go === undefined ? (
                <TimeField
                  {...slot("hold")}
                  {...named(t("workouts.dose.hold"))}
                  max={SET_TIME_MAX}
                  value={set.onS ?? 0}
                  onChange={(onS) => onChange({ ...set, onS })}
                />
              ) : (
                <View style={{ alignItems: "flex-start" }}>{go}</View>
              ),
          },
        ]
      : []),
  ];
  const [first, ...rest] = fields;
  if (first === undefined) return <></>;
  if (rest.length === 0) return <View style={{ flex: 1 }}>{first.field}</View>;
  return (
    <>
      <View style={SET_COLUMNS.count}>{first.field}</View>
      <Joiner mark={rest[0]?.mark ?? ""} />
      <View style={[SET_COLUMNS.measure, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        {rest.map((f, i) => (
          <React.Fragment key={f.key}>
            {i > 0 && <Joiner mark={f.mark} />}
            <View style={{ flex: 1, minWidth: 0 }}>{f.field}</View>
          </React.Fragment>
        ))}
      </View>
    </>
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
  const text = hangLoadValue(kg, unit);
  return (
    <KeypadField
      {...slot}
      label={label}
      accessibilityLabel={accessibilityLabel}
      compact
      fill
      mode={{
        kind: "number",
        unit,
        step: loadStep("pull", unit),
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
