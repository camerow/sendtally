import type { Workout, WorkoutKind } from "@sendtally/core/hang";
import { z } from "zod";
import { ACTIVITY_KINDS, type ActivityKind } from "./activities";
import { id, title } from "./plan";
import type { ExerciseRow } from "./repo";

export const exerciseBody = z.object({ name: title, kind: z.enum(ACTIVITY_KINDS) });

export const mergeBody = z.object({ into: id });

export type ExerciseInput = z.infer<typeof exerciseBody>;

export type Exercise = ExerciseInput & { id: string };

/** SQLite's lower(trim(name)): it folds ASCII only, as the backfill migration did. */
export const exerciseNameKey = (name: string): string =>
  name.trim().replace(/[A-Z]/g, (c) => c.toLowerCase());

/** The kind an exercise of this workout kind is, or null where items name no exercise. */
export const exerciseKindOf = (kind: WorkoutKind): ActivityKind | null =>
  ACTIVITY_KINDS.find((k) => k === kind) ?? null;

/** Every exercise a workout's items name, with the kind they take from it. */
export function workoutExercises(w: Pick<Workout, "kind" | "variations">): ExerciseInput[] {
  const kind = exerciseKindOf(w.kind);
  if (kind === null) return [];
  return w.variations.flatMap((v) => v.items.map((i) => ({ name: i.exercise.trim(), kind })));
}

export const exerciseOf = (row: ExerciseRow): Exercise => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
});
