import type { SetDone, WorkoutKind } from "./plan";

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

/**
 * What a Fingers exercise, a grip, is measured in: hangs on an edge, or a ground pull
 * off the floor in lifts or in time. Both carry weight.
 */
export const GRIP_MEASURES = ["hang", "repsWeight", "secondsWeight"] as const;

export type GripMeasure = (typeof GRIP_MEASURES)[number];

/**
 * What a climbing exercise can be measured in: climbs per set, or time on the wall per set,
 * both logged on the session tally. Rounds stays readable on climbing exercises logged in it.
 */
export const CLIMBING_MEASURES = ["reps", "seconds"] as const satisfies readonly ExerciseMeasure[];

/**
 * What a climbing exercise's trend follows: the climbs completed, the average or highest
 * grade sent, or nothing. An exercise with none set follows the climbs completed.
 */
export const EXERCISE_PROGRESS = ["completed", "averageGrade", "topGrade", "none"] as const;

export type ExerciseProgress = (typeof EXERCISE_PROGRESS)[number];

/** The measures a new or edited exercise of a category offers. */
export const measuresFor = (kind: WorkoutKind): readonly (ExerciseMeasure | GripMeasure)[] =>
  kind === "hangboard"
    ? GRIP_MEASURES
    : kind === "climbing"
      ? CLIMBING_MEASURES
      : EXERCISE_MEASURES;

const DEFAULT_MEASURE: Record<ExerciseKind, ExerciseMeasure> = {
  climbing: "reps",
  strength: "repsWeight",
  mobility: "seconds",
  other: "rounds",
};

export const defaultMeasure = (kind: ExerciseKind): ExerciseMeasure => DEFAULT_MEASURE[kind];

/**
 * The measure sets were logged or written in: weight with time or reps, time, then reps,
 * as the backfill migration reads them. Time in an Other exercise is rounds.
 */
export function measureOf(kind: ExerciseKind, sets: readonly SetDone[]): ExerciseMeasure {
  const has = (field: keyof SetDone): boolean => sets.some((s) => s[field] !== undefined);
  if (has("weightKg")) return has("onS") ? "secondsWeight" : "repsWeight";
  if (has("onS")) return kind === "other" ? "rounds" : "seconds";
  return has("reps") ? "reps" : DEFAULT_MEASURE[kind];
}
