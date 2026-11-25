import type { WorkoutKind } from "@sendtally/core/hang";
import type { PickerSource } from "@sendtally/features/exercises";

export const exercisePath = (id: string): string => `/app/train/exercise/${encodeURIComponent(id)}`;

export const gripPath = (id: string): string => `/app/train/grip/${encodeURIComponent(id)}`;

/** An exercise's page: a grip's, the user's own, or a built-in's. */
export const sourcePath = (source: PickerSource): string =>
  "grip" in source
    ? gripPath(source.grip.id)
    : exercisePath("exercise" in source ? source.exercise.id : source.builtIn.id);

export const exerciseCategoryPath = (kind: WorkoutKind): string => `/app/train/exercises/${kind}`;

export const COMPARE_GRIPS_PATH = "/app/train/grips/compare";

export const EXERCISES_VIEW = "/app/train?view=exercises";
