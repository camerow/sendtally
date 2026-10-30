import type { Exercise } from "@sendtally/api-client";
import {
  EXERCISE_KINDS,
  type ExerciseKind,
  type ExerciseMeasure,
  type GripMeasure,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { t } from "../i18n";
import { exerciseKey } from "../statistics/exercises";
import type { TallyMeasure } from "./types";

/** How a climbing exercise is logged on the session tally, or null for any other. */
export function tallyMeasureOf(
  e: { kind: ExerciseKind; measure: ExerciseMeasure } | undefined
): TallyMeasure | null {
  if (e?.kind !== "climbing") return null;
  if (e.measure === "reps") return "climbs";
  return e.measure === "seconds" ? "wallTime" : null;
}

/**
 * How the exercise a workout item names logs on the tally, by name in any case. In a climbing
 * workout, one the library does not know logs climbs.
 */
export function tallyMeasuresOf(
  exercises: readonly Pick<Exercise, "name" | "kind" | "measure">[],
  workoutKind: WorkoutKind
): (name: string) => TallyMeasure | null {
  return (name) => {
    const e = exercises.find((x) => exerciseKey(x.name) === exerciseKey(name));
    return e === undefined && workoutKind === "climbing" ? "climbs" : tallyMeasureOf(e);
  };
}

/** A climbing exercise's reps read as climbs and its time as time on the wall. */
export const measureLabel = (
  measure: ExerciseMeasure | GripMeasure,
  kind?: WorkoutKind
): string => {
  const tally =
    kind === "climbing" && measure !== "hang" ? tallyMeasureOf({ kind, measure }) : null;
  return t(`workouts.measure.${tally ?? measure}`);
};

/** Whether saving asks first: the measure of an exercise that was logged changes. */
export const measureChangeNeedsWarning = (
  before: ExerciseMeasure | GripMeasure,
  after: ExerciseMeasure | GripMeasure,
  logged: boolean
): boolean => logged && before !== after;

/** The category as an exercise of the user's own, or null for Fingers, whose exercises are grips. */
export const exerciseKindOf = (kind: WorkoutKind): (typeof EXERCISE_KINDS)[number] | null =>
  EXERCISE_KINDS.find((k) => k === kind) ?? null;
