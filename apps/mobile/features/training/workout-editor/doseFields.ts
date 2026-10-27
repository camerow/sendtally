import {
  clamp,
  clock,
  fromUnit,
  parseNumber,
  parseSeconds,
  toUnit,
  type Dose,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import type { MessageKey } from "@sendtally/features/i18n";

export type DoseKey = Exclude<keyof Dose, "edgeMm">;

export type DoseField = { key: DoseKey; label: MessageKey; measure: "count" | "time" | "weight" };

const count = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "count" });
const time = (key: DoseKey, label: MessageKey): DoseField => ({ key, label, measure: "time" });

/** The dose numbers each kind asks for, in the order they show. */
export const DOSE_FIELDS_OF: Record<WorkoutKind, readonly DoseField[]> = {
  hangboard: [
    count("reps", "workouts.dose.hangs"),
    time("onS", "workouts.dose.hangTime"),
    time("offS", "workouts.dose.restTime"),
    count("sets", "workouts.dose.sets"),
    time("setRestS", "workouts.dose.setRest"),
  ],
  climbing: [count("sets", "workouts.dose.sets"), count("reps", "workouts.dose.reps")],
  strength: [
    count("sets", "workouts.dose.sets"),
    count("reps", "workouts.dose.reps"),
    { key: "weightKg", label: "workouts.dose.weight", measure: "weight" },
  ],
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

/** What a new item of each kind starts at. */
export const NEW_DOSE: Record<WorkoutKind, Dose> = {
  hangboard: { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 },
  climbing: { sets: 4, reps: 4 },
  strength: { sets: 3, reps: 8 },
  mobility: { sets: 1, onS: 60 },
  other: { sets: 3, onS: 60, offS: 60 },
};

/** A field as typed: a count, seconds or "m:ss", a weight in the user's unit; empty when unset. */
export function fieldText(field: DoseField, dose: Dose, unit: WeightUnit): string {
  const value = dose[field.key];
  if (value === undefined) return "";
  if (field.measure === "time") return clock(value);
  return String(field.measure === "weight" ? toUnit(value, unit) : value);
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
