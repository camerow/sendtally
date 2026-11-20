import React from "react";
import { fromUnit, toUnit, type SetDone, type WeightUnit } from "@sendtally/core/hang";
import { hangLoadValue } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";
import { SET_COLUMNS } from "./setColumns";

export type SetDoneFieldsProps = {
  set: SetDone;
  /** Always asks reps and weight, even before either is set. */
  lifting?: boolean;
  unit: WeightUnit;
  /** Names the set for screen readers, ahead of each field's own name. */
  label: string;
  /** A hangboard set: its hangs typed and its load. */
  hangs?: boolean;
  /** A hangboard set of one hang: its count field is the time held, empty when it did not hold. */
  oneHang?: boolean;
  /** In place of the hold field: ▶ to time it. */
  go?: React.ReactNode;
  /** The load a hang set shows while it has none of its own: the session's. */
  defaultLoadKg?: number;
  onChange: (set: SetDone) => void;
};

/** A set's hold or time held reads MM:SS, so it stays under an hour. */
const SET_TIME_MAX = 3599;

function Joiner({ mark }: { mark: string }): React.ReactElement {
  return (
    <span aria-hidden="true" className={SET_COLUMNS.join}>
      {mark}
    </span>
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
  defaultLoadKg = 0,
  go,
  onChange,
}: SetDoneFieldsProps): React.ReactElement {
  const reps = lifting || hangs || set.reps !== undefined;
  const weight = hangs || lifting || set.weightKg !== undefined;
  const hold = !hangs && set.onS !== undefined;
  const kg = set.weightKg ?? (hangs ? defaultLoadKg : undefined);
  const named = (name: string): string => `${label} · ${name}`;
  const fields: { key: string; mark: string; field: React.ReactNode }[] = [
    ...(reps
      ? [
          {
            key: "reps",
            mark: "",
            field: oneHang ? (
              <NumberField
                compact
                label={named(t("plan.colHeld"))}
                value={set.reps === 0 ? 0 : (set.onS ?? 0)}
                onChange={(onS) => onChange({ ...set, reps: onS > 0 ? 1 : 0, onS })}
                mode={{ kind: "time", max: SET_TIME_MAX }}
              />
            ) : (
              <NumberField
                compact
                label={named(hangs ? t("plan.colHangs") : t("workouts.dose.reps"))}
                value={hangs && set.reps === 0 ? null : (set.reps ?? null)}
                onChange={(n) => onChange({ ...set, reps: n })}
                mode={{ kind: "number", step: 1, max: 1000 }}
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
                compact
                label={named(hangs ? t("hang.load") : t("hang.weight"))}
                value={kg === undefined ? null : toUnit(kg, unit)}
                onChange={(n) => onChange({ ...set, weightKg: fromUnit(n, unit) })}
                mode={{
                  kind: "number",
                  step: unit === "lb" ? 5 : 2.5,
                  min: toUnit(-200, unit),
                  max: toUnit(1000, unit),
                  decimals: true,
                  signed: true,
                }}
                {...(hangs && kg !== undefined && { display: hangLoadValue(kg, unit) })}
                {...(!(hangs && toUnit(kg ?? 0, unit) === 0) && { unit })}
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
            field: go ?? (
              <NumberField
                compact
                label={named(t("workouts.dose.hold"))}
                value={set.onS ?? 0}
                onChange={(onS) => onChange({ ...set, onS })}
                mode={{ kind: "time", max: SET_TIME_MAX }}
              />
            ),
          },
        ]
      : []),
  ];
  const [first, ...rest] = fields;
  if (first === undefined) return <></>;
  if (rest.length === 0) return <span className="set-fill">{first.field}</span>;
  return (
    <>
      <span className={SET_COLUMNS.count}>{first.field}</span>
      <Joiner mark={rest[0]?.mark ?? ""} />
      <span className={SET_COLUMNS.measure}>
        {rest.map((f, i) => (
          <React.Fragment key={f.key}>
            {i > 0 && <Joiner mark={f.mark} />}
            <span className="set-fill">{f.field}</span>
          </React.Fragment>
        ))}
      </span>
    </>
  );
}
