import type { SetDone } from "./plan";

/** What an exercise's sets ask for, and the unit its trend uses. */
export const EXERCISE_MEASURES = [
  "reps",
  "repsWeight",
  "seconds",
  "secondsWeight",
  "rounds",
] as const;

export type ExerciseMeasure = (typeof EXERCISE_MEASURES)[number];

/** The categories an exercise of the user's own can be; Fingers exercises are grips. */
export const EXERCISE_KINDS = ["climbing", "strength", "mobility", "other"] as const;

export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

const DEFAULT_MEASURE: Record<ExerciseKind, ExerciseMeasure> = {
  climbing: "rounds",
  strength: "repsWeight",
  mobility: "seconds",
  other: "rounds",
};

export const defaultMeasure = (kind: ExerciseKind): ExerciseMeasure => DEFAULT_MEASURE[kind];

/**
 * The measure sets were logged or written in: weight with time or reps, time, then reps,
 * as the backfill migration reads them. Time in an Other or Climbing exercise is rounds.
 */
export function measureOf(kind: ExerciseKind, sets: readonly SetDone[]): ExerciseMeasure {
  const has = (field: keyof SetDone): boolean => sets.some((s) => s[field] !== undefined);
  if (has("weightKg")) return has("onS") ? "secondsWeight" : "repsWeight";
  if (has("onS")) return DEFAULT_MEASURE[kind] === "rounds" ? "rounds" : "seconds";
  return has("reps") ? "reps" : DEFAULT_MEASURE[kind];
}
