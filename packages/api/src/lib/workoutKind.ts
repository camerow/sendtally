import {
  defaultExerciseRestS,
  exerciseKinds,
  gripsTogether,
  isBuiltInGrip,
  withGroupsSettled,
  workoutKindOfItems,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import type { FocusOptional, WorkoutBody } from "./plan";
import * as repo from "./repo";

/**
 * The workout as saved: its grips together as its fingerboard part, and its kind read off its
 * exercises, the kind sent standing in for an exercise not saved yet; with none, the one sent,
 * else the one saved, else Other. `isGrip` says which items are grips.
 */
export async function withDerivedKind(
  db: D1Database,
  userId: string,
  body: WorkoutBody,
  saved?: WorkoutKind
): Promise<{ workout: Omit<FocusOptional<Workout>, "id">; isGrip: (exercise: string) => boolean }> {
  const fallback = body.kind ?? saved ?? "other";
  const { isGrip, kindIn } = await kindLookup(db, userId);
  const items = withGroupsSettled(gripsTogether(body.items, isGrip), (e) =>
    isGrip(e) ? "hangboard" : kindIn(e)
  );
  const kind = workoutKindOfItems(items, kindIn, fallback);
  const exerciseRestS = body.exerciseRestS ?? defaultExerciseRestS(kind);
  return { workout: { ...body, items, kind, exerciseRestS }, isGrip };
}

export async function kindLookup(
  db: D1Database,
  userId: string
): Promise<{
  isGrip: (exercise: string) => boolean;
  kindIn: (exercise: string) => WorkoutKind | undefined;
}> {
  const [mine, grips, library] = await Promise.all([
    repo.listExercises(db, userId),
    repo.listHangGrips(db, userId),
    repo.library(db, ""),
  ]);
  const gripIds = new Set([...grips.map((g) => g.id), ...library.grips.map((g) => g.id)]);
  const isGrip = (exercise: string): boolean => isBuiltInGrip(exercise) || gripIds.has(exercise);
  const builtIns = library.exercises.map((e) => ({ name: e.name, kind: e.spec.kind }));
  return { isGrip, kindIn: exerciseKinds([...builtIns, ...mine], isGrip) };
}
