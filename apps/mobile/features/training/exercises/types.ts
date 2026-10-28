import type { Exercise } from "@sendtally/api-client";
import type { ExerciseMeasure, Grip, WorkoutKind } from "@sendtally/core/hang";

export type ExerciseChartMetric = "best" | "e1rm";

/** What the exercise sheet asks for. */
export type ExerciseForm = {
  kind: WorkoutKind;
  name: string;
  measure: ExerciseMeasure;
  eachSide: boolean;
};

/** What saving a new exercise gave: a grip for Fingers, else the user's exercise. */
export type MadeExercise = { grip: Grip } | { exercise: Exercise };
