import {
  clamp,
  isRanged,
  type Ranged,
  RANGE_TOP,
  withTop,
  fromUnit,
  toUnit,
  type Dose,
  type ExerciseKind,
  type ExerciseMeasure,
  type GripMeasure,
  type NumberLimits,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { tallyMeasureOf } from "../exercises/measure";
import type { TallyMeasure } from "../exercises/types";
import { t, type MessageKey } from "../i18n";

export type DoseKey = Exclude<keyof Dose, "edgeMm" | "name">;

/**
 * What an item's doses ask for: its exercise's measure, how a climbing one logs on the tally,
 * or on the hangboard whether its grip hangs or pulls off the ground.
 */
export type DoseMeasure = ExerciseMeasure | TallyMeasure | GripMeasure;

export type DoseField = {
  key: DoseKey;
  label: MessageKey;
  measure: "count" | "time" | "weight";
  /** What an empty field means, when it means something. */
  placeholder?: MessageKey;
  /** Whether it takes a range, such as 3-5 sets. */
  range?: boolean;
};

const count = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "count" });
const time = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "time" });
const weight: DoseField = { key: "weightKg", label: "hang.weight", measure: "weight" };
const rpe: DoseField = { key: "targetRpe", label: "workouts.dose.rpe", measure: "count" };
const sets: DoseField = { ...count("sets", "workouts.dose.sets"), range: true };
const reps: DoseField = { ...count("reps", "workouts.dose.reps"), range: true };

/** The dose numbers a grip asks for: hangs, or a ground pull's lifts or time. Weight is chosen per use. */
const FINGERS_FIELDS: Record<GripMeasure, readonly DoseField[]> = {
  hang: [
    count("reps", "workouts.dose.hangs"),
    time("onS", "workouts.dose.hangTime"),
    time("offS", "workouts.dose.restTime"),
    count("sets", "workouts.dose.sets"),
  ],
  repsWeight: [count("reps", "workouts.dose.reps"), count("sets", "workouts.dose.sets")],
  secondsWeight: [time("onS", "workouts.dose.time"), count("sets", "workouts.dose.sets")],
};

/** The dose numbers each kind asks for, in the order they show. */
export const DOSE_FIELDS_OF: Record<WorkoutKind, readonly DoseField[]> = {
  hangboard: FINGERS_FIELDS.hang,
  climbing: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps"), rpe],
  strength: [sets, reps, weight, rpe],
  mobility: [sets, reps, time("onS", "workouts.dose.hold"), rpe],
  other: [
    count("sets", "workouts.dose.rounds"),
    time("onS", "workouts.dose.work"),
    time("offS", "workouts.dose.rest"),
  ],
};

/** The dose numbers each measure asks for, in the order they show. Climbing asks no grade. */
export const DOSE_FIELDS_BY_MEASURE: Record<Exclude<DoseMeasure, "hang">, readonly DoseField[]> = {
  climbs: [
    count("sets", "workouts.dose.sets"),
    { ...count("reps", "workouts.dose.climbs"), placeholder: "workouts.dose.anyClimbs" },
    rpe,
  ],
  wallTime: [count("sets", "workouts.dose.sets"), time("onS", "workouts.dose.time"), rpe],
  laps: [count("sets", "workouts.dose.laps"), count("reps", "workouts.dose.moves"), rpe],
  reps: [sets, reps, rpe],
  repsWeight: [sets, reps, weight, rpe],
  seconds: [count("sets", "workouts.dose.sets"), time("onS", "workouts.dose.hold"), rpe],
  secondsWeight: [
    count("sets", "workouts.dose.sets"),
    time("onS", "workouts.dose.hold"),
    weight,
    rpe,
  ],
  rounds: [
    count("sets", "workouts.dose.rounds"),
    time("onS", "workouts.dose.work"),
    time("offS", "workouts.dose.rest"),
  ],
};

/** What a new item of each kind starts at. */
const NEW_DOSE: Record<WorkoutKind, Dose> = {
  hangboard: { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 },
  climbing: { sets: 4, reps: 4 },
  strength: { sets: 3, reps: 8 },
  mobility: { sets: 1, onS: 60 },
  other: { sets: 3, onS: 60, offS: 60 },
};

/** What a new item on a grip starts at; a ground pull held for time has no edge. */
const NEW_FINGERS_DOSE: Record<GripMeasure, Dose> = {
  hang: NEW_DOSE.hangboard,
  repsWeight: { sets: 5, reps: 5, setRestS: 120 },
  secondsWeight: { sets: 5, reps: 1, onS: 10, edgeMm: 0, setRestS: 120 },
};

/** What a new item of each measure starts at. */
const NEW_DOSE_BY_MEASURE: Record<Exclude<DoseMeasure, "hang">, Dose> = {
  climbs: { sets: 4, reps: 4, setRestS: 240 },
  wallTime: { sets: 2, onS: 1200, setRestS: 300 },
  laps: { sets: 3, reps: 40, setRestS: 240 },
  reps: { sets: 3, reps: 10 },
  repsWeight: { sets: 3, reps: 8 },
  seconds: { sets: 1, onS: 60 },
  secondsWeight: { sets: 3, onS: 10 },
  rounds: { sets: 4, onS: 240, offS: 240 },
};

const byMeasure = (
  kind: WorkoutKind,
  measure?: DoseMeasure
): measure is Exclude<DoseMeasure, "hang"> =>
  kind !== "hangboard" && measure !== undefined && measure !== "hang";

/** A grip's measure: a ground pull by lifts or time, else a hang. */
export const fingersMeasure = (measure?: DoseMeasure): GripMeasure =>
  measure === "repsWeight" || measure === "secondsWeight" ? measure : "hang";

/** The measure an item of one of the user's exercises takes its doses by. */
export const doseMeasureOf = (
  e: { kind: ExerciseKind; measure: ExerciseMeasure } | undefined
): DoseMeasure | undefined => tallyMeasureOf(e) ?? e?.measure;

/** A circuit's laps timed: each lap is a time on the wall rather than a number of moves. */
const TIMED_LAP_FIELDS = [
  count("sets", "workouts.dose.laps"),
  time("onS", "workouts.dose.time"),
  rpe,
];

/**
 * The fields an item asks for: a grip's on the hangboard, else its exercise's measure, else
 * its workout kind's. A circuit's laps are moves, or time when its first dose holds a time.
 */
export const doseFieldsFor = (
  kind: WorkoutKind,
  measure?: DoseMeasure,
  dose?: Dose
): readonly DoseField[] => {
  if (kind === "hangboard") return FINGERS_FIELDS[fingersMeasure(measure)];
  if (measure === "laps" && dose?.onS !== undefined) return TIMED_LAP_FIELDS;
  return byMeasure(kind, measure) ? DOSE_FIELDS_BY_MEASURE[measure] : DOSE_FIELDS_OF[kind];
};

/** What a new item starts at, by the same rule. */
export const newDoseFor = (kind: WorkoutKind, measure?: DoseMeasure): Dose => {
  if (kind === "hangboard") return { ...NEW_FINGERS_DOSE[fingersMeasure(measure)] };
  return { ...(byMeasure(kind, measure) ? NEW_DOSE_BY_MEASURE[measure] : NEW_DOSE[kind]) };
};

/** A field in the user's unit; null when unset. */
export function fieldValue(field: DoseField, dose: Dose, unit: WeightUnit): number | null {
  const value = dose[field.key];
  if (value === undefined) return null;
  return field.measure === "weight" ? toUnit(value, unit) : value;
}

/** An empty count that takes a range shows an example of each way to fill it. */
export const RANGE_PLACEHOLDER: Record<Ranged, string> = { sets: "3, 3-5", reps: "8, 8-12" };

/** What an empty field reads as: no added weight, its own hint, an example range, else a dash. */
export function fieldPlaceholder(field: DoseField): string | undefined {
  if (field.measure === "weight") return t("hang.bodyweight");
  if (field.placeholder !== undefined) return t(field.placeholder);
  return field.range === true && isRanged(field.key) ? RANGE_PLACEHOLDER[field.key] : undefined;
}

/** The top of a range in a field that takes one; none when it holds one number. */
export const fieldTop = (field: DoseField, dose: Dose): number | undefined =>
  field.range === true && isRanged(field.key) ? dose[RANGE_TOP[field.key]] : undefined;

/** The dose with a field set to a range in the user's unit; a top at or under the bottom is none. */
export function withFieldRange(
  dose: Dose,
  field: DoseField,
  value: number,
  max: number | undefined,
  unit: WeightUnit
): Dose {
  const next = withField(dose, field, value, unit);
  if (field.range !== true || !isRanged(field.key)) return next;
  return withTop(next, field.key, max, limitsOf(field)[1]);
}

/** How a count or weight types on the keypad: weight by 2.5 kg or 5 lb, stepping below zero for assistance. */
export function fieldLimits(field: DoseField, unit: WeightUnit): NumberLimits {
  if (field.measure === "weight")
    return { step: unit === "lb" ? 5 : 2.5, decimals: true, min: toUnit(LIMITS.weight[0], unit) };
  const [min, max] = limitsOf(field);
  return { step: 1, min, max };
}

/** The counts held to a range of their own. */
const RANGE: Partial<Record<DoseKey, readonly [number, number]>> = {
  sets: [1, 100],
  targetRpe: [0, 10],
};

const LIMITS: Record<DoseField["measure"], readonly [number, number]> = {
  count: [0, 1000],
  time: [0, 86400],
  weight: [-200, 1000],
};

const limitsOf = (field: DoseField): readonly [number, number] =>
  RANGE[field.key] ?? LIMITS[field.measure];

/** The dose with one field set in the user's unit. Zero clears any field but sets. */
export function withField(dose: Dose, field: DoseField, value: number, unit: WeightUnit): Dose {
  if (value === 0 && field.key !== "sets") {
    const { [field.key]: _, ...rest } = dose;
    return rest;
  }
  const typed = field.measure === "weight" ? fromUnit(value, unit) : Math.round(value);
  const [min, max] = limitsOf(field);
  return { ...dose, [field.key]: clamp(typed, min, max) };
}
