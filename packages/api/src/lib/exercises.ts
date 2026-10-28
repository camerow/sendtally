import {
  EXERCISE_KINDS,
  EXERCISE_MEASURES,
  measureOf,
  type ExerciseKind,
  type ExerciseMeasure,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { z } from "zod";
import { id, title } from "./plan";
import type { ExerciseRow } from "./repo";

// Older app builds send a name and kind only: a new exercise then takes its kind's
// measure, and a rename keeps what it had.
export const exerciseBody = z.object({
  name: title,
  kind: z.enum(EXERCISE_KINDS),
  measure: z.enum(EXERCISE_MEASURES).optional(),
  eachSide: z.boolean().optional(),
  builtIn: id.nullable().optional(),
});

export const mergeBody = z.object({ into: id });

export type ExerciseInput = z.infer<typeof exerciseBody>;

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  measure: ExerciseMeasure;
  eachSide: boolean;
  /** The library exercise it was picked from, whose name the apps translate. */
  builtIn: string | null;
  archived: boolean;
};

/** SQLite's lower(trim(name)): it folds ASCII only, as the backfill migration did. */
export const exerciseNameKey = (name: string): string =>
  name.trim().replace(/[A-Z]/g, (c) => c.toLowerCase());

/** The kind an exercise of this workout kind is, or null where items name grips. */
export const exerciseKindOf = (kind: WorkoutKind): ExerciseKind | null =>
  EXERCISE_KINDS.find((k) => k === kind) ?? null;

/** Every exercise a workout's items name, with the kind they take from it and the measure its doses write. */
export function workoutExercises(w: Pick<Workout, "kind" | "items">): ExerciseInput[] {
  const kind = exerciseKindOf(w.kind);
  if (kind === null) return [];
  return w.items.map((i) => ({
    name: i.exercise.trim(),
    kind,
    measure: measureOf(kind, i.doses),
  }));
}

export const exerciseOf = (row: ExerciseRow): Exercise => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  measure: row.measure,
  eachSide: row.each_side,
  builtIn: row.built_in,
  archived: row.archived,
});
