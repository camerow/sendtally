import type { WorkoutKind } from "@sendtally/core/hang";

export const exercisePath = (id: string): string => `/app/train/exercise/${encodeURIComponent(id)}`;

export const gripPath = (id: string): string => `/app/train/grip/${encodeURIComponent(id)}`;

export const exerciseCategoryPath = (kind: WorkoutKind): string => `/app/train/exercises/${kind}`;

export const COMPARE_GRIPS_PATH = "/app/train/grips/compare";

export const EXERCISES_VIEW = "/app/train?view=exercises";
