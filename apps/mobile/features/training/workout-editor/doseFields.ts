import {
  clamp,
  clock,
  fromUnit,
  parseNumber,
  parseSeconds,
  toUnit,
  type Dose,
  type ExerciseKind,
  type ExerciseMeasure,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { tallyMeasureOf, type TallyMeasure } from "@sendtally/features/exercises";
import type { MessageKey } from "@sendtally/features/i18n";

export type DoseKey = Exclude<keyof Dose, "edgeMm" | "name">;

/** What an item's doses ask for: its exercise's measure, or how a climbing one logs on the tally. */
export type DoseMeasure = ExerciseMeasure | TallyMeasure;

export type DoseField = {
  key: DoseKey;
  label: MessageKey;
  measure: "count" | "time" | "weight";
  /** What an empty field means, when it means something. */
  placeholder?: MessageKey;
};

const count = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "count" });
const time = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "time" });
const weight: DoseField = { key: "weightKg", label: "workouts.dose.weight", measure: "weight" };

/** The dose numbers each kind asks for, in the order they show. */
export const DOSE_FIELDS_OF: Record<WorkoutKind, readonly DoseField[]> = {
  hangboard: [
    count("reps", "workouts.dose.hangs"),
    time("onS", "workouts.dose.hangTime"),
    time("offS", "workouts.dose.restTime"),
    count("sets", "workouts.dose.sets"),
  ],
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
export const DOSE_FIELDS_BY_MEASURE: Record<DoseMeasure, readonly DoseField[]> = {
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

/** What a new item of each measure starts at. */
const NEW_DOSE_BY_MEASURE: Record<DoseMeasure, Dose> = {
  climbs: { sets: 4, reps: 4, setRestS: 240 },
  wallTime: { sets: 2, onS: 1200, setRestS: 300 },
  reps: { sets: 3, reps: 10 },
  repsWeight: { sets: 3, reps: 8 },
  seconds: { sets: 1, onS: 60 },
  secondsWeight: { sets: 3, onS: 10 },
  rounds: { sets: 4, onS: 240, offS: 240 },
};

const byMeasure = (kind: WorkoutKind, measure?: DoseMeasure): measure is DoseMeasure =>
  kind !== "hangboard" && measure !== undefined;

/** The measure an item of one of the user's exercises takes its doses by. */
export const doseMeasureOf = (
  e: { kind: ExerciseKind; measure: ExerciseMeasure } | undefined
): DoseMeasure | undefined => tallyMeasureOf(e) ?? e?.measure;

/** The fields an item asks for: a grip's on the hangboard, else its exercise's measure, else its workout kind's. */
export const doseFieldsFor = (kind: WorkoutKind, measure?: DoseMeasure): readonly DoseField[] =>
  byMeasure(kind, measure) ? DOSE_FIELDS_BY_MEASURE[measure] : DOSE_FIELDS_OF[kind];

/** What a new item starts at, by the same rule. */
export const newDoseFor = (kind: WorkoutKind, measure?: DoseMeasure): Dose => ({
  ...(byMeasure(kind, measure) ? NEW_DOSE_BY_MEASURE[measure] : NEW_DOSE[kind]),
});

/** A field as typed: a count, seconds or "m:ss", a weight in the user's unit; empty when unset. */
export function fieldText(field: DoseField, dose: Dose, unit: WeightUnit): string {
  const value = dose[field.key];
  if (value === undefined) return "";
  if (field.measure === "time") return clock(value);
  return String(field.measure === "weight" ? toUnit(value, unit) : value).replace("-", "−");
}

const LIMITS: Record<DoseField["measure"], readonly [number, number]> = {
  count: [0, 1000],
  time: [0, 86400],
  weight: [-200, 1000],
};

/** The dose with one field typed in; empty clears it. Null when the text is not a number. */
export function withField(
  dose: Dose,
  field: DoseField,
  text: string,
  unit: WeightUnit
): Dose | null {
  if (text.trim() === "") {
    if (field.key === "sets") return null;
    const { [field.key]: _, ...rest } = dose;
    return rest;
  }
  const n = field.measure === "time" ? parseSeconds(text, "s") : parseNumber(text);
  if (n === null) return null;
  const typed = field.measure === "weight" ? fromUnit(n, unit) : Math.round(n);
  const [min, max] = field.key === "sets" ? [1, 100] : LIMITS[field.measure];
  return { ...dose, [field.key]: clamp(typed, min, max) };
}
