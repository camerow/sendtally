import {
  defaultExerciseRestS,
  exerciseNameKey,
  isBuiltInGrip,
  workoutKindOf,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import type { FocusOptional, WorkoutBody } from "./plan";
import * as repo from "./repo";

/**
 * The workout as saved: its kind read off its exercises, the kind sent standing in for
 * an exercise not saved yet; with none, the one sent, else the one saved, else Other.
 */
export async function withDerivedKind(
  db: D1Database,
  userId: string,
  body: WorkoutBody,
  saved?: WorkoutKind
): Promise<Omit<FocusOptional<Workout>, "id">> {
  const fallback = body.kind ?? saved ?? "other";
  const exercises = body.items.map((i) => i.exercise);
  const kindOf = exercises.length === 0 ? () => fallback : await kindLookup(db, userId, fallback);
  const kind = workoutKindOf(exercises, kindOf, fallback);
  return { ...body, kind, exerciseRestS: body.exerciseRestS ?? defaultExerciseRestS(kind) };
}

async function kindLookup(
  db: D1Database,
  userId: string,
  fallback: WorkoutKind
): Promise<(exercise: string) => WorkoutKind> {
  const [mine, grips, library] = await Promise.all([
    repo.listExercises(db, userId),
    repo.listHangGrips(db, userId),
    repo.library(db),
  ]);
  const gripIds = new Set([...grips.map((g) => g.id), ...library.grips.map((g) => g.id)]);
  const kinds = new Map<string, WorkoutKind>([
    ...library.exercises.map((e) => [exerciseNameKey(e.name), e.spec.kind] as const),
    ...mine.map((e) => [exerciseNameKey(e.name), e.kind] as const),
  ]);
  return (exercise) =>
    isBuiltInGrip(exercise) || gripIds.has(exercise)
      ? "hangboard"
      : (kinds.get(exerciseNameKey(exercise)) ?? fallback);
}
