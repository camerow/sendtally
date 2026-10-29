import {
  clamp,
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
import { tallyMeasureOf, type TallyMeasure } from "@sendtally/features/exercises";
import type { MessageKey } from "@sendtally/features/i18n";

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
};

const count = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "count" });
const time = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "time" });
const weight: DoseField = { key: "weightKg", label: "hang.weight", measure: "weight" };

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
  climbing: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps")],
  strength: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps"), weight],
  mobility: [
    count("sets", "workouts.dose.sets"),
    count("reps", "workouts.dose.reps"),
    time("onS", "workouts.dose.hold"),
  ],
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
  ],
  wallTime: [count("sets", "workouts.dose.sets"), time("onS", "workouts.dose.time")],
  reps: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps")],
  repsWeight: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps"), weight],
  seconds: [count("sets", "workouts.dose.sets"), time("onS", "workouts.dose.hold")],
  secondsWeight: [count("sets", "workouts.dose.sets"), time("onS", "workouts.dose.hold"), weight],
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

/** The fields an item asks for: a grip's on the hangboard, else its exercise's measure, else its workout kind's. */
export const doseFieldsFor = (kind: WorkoutKind, measure?: DoseMeasure): readonly DoseField[] => {
  if (kind === "hangboard") return FINGERS_FIELDS[fingersMeasure(measure)];
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

/** How a count or weight types on the keypad: weight by 2.5 kg or 5 lb, stepping below zero for assistance. */
export function fieldLimits(field: DoseField, unit: WeightUnit): NumberLimits {
  if (field.measure === "weight")
    return { step: unit === "lb" ? 5 : 2.5, decimals: true, min: toUnit(LIMITS.weight[0], unit) };
  return field.key === "sets" ? { step: 1, min: 1, max: 100 } : { step: 1, max: 1000 };
}

const LIMITS: Record<DoseField["measure"], readonly [number, number]> = {
  count: [0, 1000],
  time: [0, 86400],
  weight: [-200, 1000],
};

/** The dose with one field set in the user's unit. Zero clears any field but sets. */
export function withField(dose: Dose, field: DoseField, value: number, unit: WeightUnit): Dose {
  if (value === 0 && field.key !== "sets") {
    const { [field.key]: _, ...rest } = dose;
    return rest;
  }
  const typed = field.measure === "weight" ? fromUnit(value, unit) : Math.round(value);
  const [min, max] = field.key === "sets" ? [1, 100] : LIMITS[field.measure];
  return { ...dose, [field.key]: clamp(typed, min, max) };
}
