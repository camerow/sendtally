import type { Exercise } from "@sendtally/api-client";
import type {
  ExerciseMeasure,
  ExerciseProgress,
  Grip,
  GripMeasure,
  WorkoutKind,
} from "@sendtally/core/hang";

export type ExerciseChartMetric = "best" | "e1rm";

/** What the exercise sheet asks for. A Fingers exercise takes a grip's measure. */
export type ExerciseForm = {
  kind: WorkoutKind;
  name: string;
  measure: ExerciseMeasure | GripMeasure;
  eachSide: boolean;
  /** What a climbing exercise's trend follows; unset follows the climbs completed. */
  progress?: ExerciseProgress | null;
};

/** What saving a new exercise gave: a grip for Fingers, else the user's exercise. */
export type MadeExercise = { grip: Grip } | { exercise: Exercise };
