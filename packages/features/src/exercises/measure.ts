import { EXERCISE_KINDS, type ExerciseMeasure, type WorkoutKind } from "@sendtally/core/hang";
import { t } from "../i18n";

export const measureLabel = (measure: ExerciseMeasure): string => t(`workouts.measure.${measure}`);

/** Whether saving asks first: the measure of an exercise that was logged changes. */
export const measureChangeNeedsWarning = (
  before: ExerciseMeasure,
  after: ExerciseMeasure,
  logged: boolean
): boolean => logged && before !== after;

/** The category as an exercise of the user's own, or null for Fingers, whose exercises are grips. */
export const exerciseKindOf = (kind: WorkoutKind): (typeof EXERCISE_KINDS)[number] | null =>
  EXERCISE_KINDS.find((k) => k === kind) ?? null;
