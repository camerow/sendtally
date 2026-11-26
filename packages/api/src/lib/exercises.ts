import {
  EXERCISE_KINDS,
  EXERCISE_MEASURES,
  EXERCISE_PROGRESS,
  entryNames,
  exerciseNameKey,
  isChecklist,
  measureOf,
  type BuiltInExerciseEntry,
  type BuiltInLibrary,
  type ExerciseKind,
  type ExerciseMeasure,
  type ExerciseProgress,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { z } from "zod";
import { description, id, title } from "./plan";
import type { ExerciseRow } from "./repo";

// Older app builds send a name and kind only: a new exercise then takes its kind's
// measure, and a rename keeps what it had, its progress too.
export const exerciseBody = z.object({
  name: title,
  kind: z.enum(EXERCISE_KINDS),
  measure: z.enum(EXERCISE_MEASURES).optional(),
  eachSide: z.boolean().optional(),
  progress: z.enum(EXERCISE_PROGRESS).nullable().optional(),
  builtIn: id.nullable().optional(),
  description: description.optional(),
});

export const mergeBody = z.object({ into: id });

export type ExerciseInput = z.infer<typeof exerciseBody>;

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  measure: ExerciseMeasure;
  eachSide: boolean;
  /** What a climbing exercise's trend follows; null follows the climbs completed. */
  progress: ExerciseProgress | null;
  /** The library exercise it was picked from, whose name the apps translate. */
  builtIn: string | null;
  /** Empty when it has none; a built-in's comes from the library instead. */
  description: string;
  archived: boolean;
};

export { exerciseNameKey };

/** The active built-in exercise going by this name in any of its languages, in any case. */
export function builtInNamed(
  library: Pick<BuiltInLibrary, "exercises">,
  name: string
): BuiltInExerciseEntry | undefined {
  const key = exerciseNameKey(name);
  return library.exercises.find(
    (e) => e.status === "active" && entryNames(e).some((n) => exerciseNameKey(n) === key)
  );
}

/** The kind an exercise of this workout kind is, or null where items name grips. */
export const exerciseKindOf = (kind: WorkoutKind): ExerciseKind | null =>
  EXERCISE_KINDS.find((k) => k === kind) ?? null;

/** Every exercise a workout's items name, with the kind they take from it and the measure its doses write. */
export function workoutExercises(
  w: Pick<Workout, "kind" | "items">,
  isGrip: (exercise: string) => boolean
): ExerciseInput[] {
  const kind = exerciseKindOf(w.kind);
  if (kind === null) return [];
  return w.items
    .filter((i) => !isGrip(i.exercise) && !isChecklist(i))
    .map((i) => ({
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
  progress: row.progress,
  builtIn: row.built_in,
  description: row.description ?? "",
  archived: row.archived,
});
