import React from "react";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  /** A hangboard set: its hangs typed and its load. */
  hangs?: boolean;
  /** Fell short of its target: the count it fell short on reads amber. */
  short?: boolean;
  /** In place of the hold field: ▶ to time it. */
  go?: React.ReactNode;
  /** Held less than its target: the hold reads amber. */
  holdShort?: boolean;
  /** The load a hang set shows while it has none of its own: the session's. */
  defaultLoadKg?: number;
  onChange: (set: SetDone) => void;
};

function Joiner({ mark }: { mark: string }): React.ReactElement {
  return (
    <span aria-hidden="true" className="set-joiner">
      {mark}
    </span>
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
  defaultLoadKg = 0,
  go,
  holdShort = false,
  onChange,
}: SetDoneFieldsProps): React.ReactElement {
  const reps = lifting || hangs || set.reps !== undefined;
  const weight = hangs || lifting || set.weightKg !== undefined;
  const hold = !hangs && set.onS !== undefined;
  const kg = set.weightKg ?? (hangs ? defaultLoadKg : undefined);
  const weightLimits = {
    kind: "number",
    step: unit === "lb" ? 5 : 2.5,
    min: toUnit(-200, unit),
    max: toUnit(1000, unit),
    decimals: true,
    signed: true,
  } as const;
  return (
    <span className="set-fields">
      {reps && (
        <NumberField
          compact
          label={`${label} · ${hangs ? t("plan.colHangs") : t("workouts.dose.reps")}`}
          short={short}
          value={set.reps ?? 0}
          onChange={(n) => onChange({ ...set, reps: n })}
          mode={{ kind: "number", step: 1, max: 1000 }}
        />
      )}
      {reps && weight && <Joiner mark="×" />}
      {weight && (
        <NumberField
          compact
          label={`${label} · ${hangs ? t("hang.load") : t("hang.weight")}`}
          value={kg === undefined ? 0 : toUnit(kg, unit)}
          onChange={(n) => onChange({ ...set, weightKg: fromUnit(n, unit) })}
          mode={weightLimits}
          unit={unit}
        />
      )}
      {(reps || weight) && hold && <Joiner mark="·" />}
      {hold && go}
      {hold && go === undefined && (
        <NumberField
          compact
          short={holdShort}
          label={`${label} · ${t("workouts.dose.hold")}`}
          value={set.onS ?? 0}
          onChange={(onS) => onChange({ ...set, onS })}
          mode={{ kind: "time" }}
        />
      )}
    </span>
  );
}
