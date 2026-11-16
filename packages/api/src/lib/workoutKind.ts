import {
  defaultExerciseRestS,
  exerciseKinds,
  isBuiltInGrip,
  mixesGrips,
  workoutKindOf,
  type Workout,
  type WorkoutKind,
} from "@sendtally/core/hang";
import type { FocusOptional, WorkoutBody } from "./plan";
import * as repo from "./repo";

/** What a save that mixes grips with other exercises is refused with. */
export const MIXED_GRIPS =
  "A workout holds only grips or no grips: grips run in the hang timer and log as hang sessions, other exercises run in the sets player.";

export class MixedGripsError extends Error {
  constructor() {
    super(MIXED_GRIPS);
  }
}

/**
 * The workout as saved: its kind read off its exercises, the kind sent standing in for
 * an exercise not saved yet; with none, the one sent, else the one saved, else Other.
 * Throws MixedGripsError for items that mix grips with other exercises.
 */
export async function withDerivedKind(
  db: D1Database,
  userId: string,
  body: WorkoutBody,
  saved?: WorkoutKind
): Promise<Omit<FocusOptional<Workout>, "id">> {
  const fallback = body.kind ?? saved ?? "other";
  const exercises = body.items.map((i) => i.exercise);
  let kind = fallback;
  if (exercises.length > 0) {
    const { isGrip, kindIn } = await kindLookup(db, userId);
    if (mixesGrips(exercises, isGrip)) throw new MixedGripsError();
    kind = workoutKindOf(exercises, (e) => kindIn(e) ?? fallback, fallback);
  }
  return { ...body, kind, exerciseRestS: body.exerciseRestS ?? defaultExerciseRestS(kind) };
}

async function kindLookup(
  db: D1Database,
  userId: string
): Promise<{
  isGrip: (exercise: string) => boolean;
  kindIn: (exercise: string) => WorkoutKind | undefined;
}> {
  const [mine, grips, library] = await Promise.all([
    repo.listExercises(db, userId),
    repo.listHangGrips(db, userId),
    repo.library(db),
  ]);
  const gripIds = new Set([...grips.map((g) => g.id), ...library.grips.map((g) => g.id)]);
  const isGrip = (exercise: string): boolean => isBuiltInGrip(exercise) || gripIds.has(exercise);
  const builtIns = library.exercises.map((e) => ({ name: e.name, kind: e.spec.kind }));
  return { isGrip, kindIn: exerciseKinds([...builtIns, ...mine], isGrip) };
}
