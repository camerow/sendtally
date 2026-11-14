import type { Exercise } from "@sendtally/api-client";
import type {
  ExerciseKind,
  ExerciseMeasure,
  ExerciseProgress,
  Grip,
  GripMeasure,
  WorkoutKind,
} from "@sendtally/core/hang";

/** How a climbing exercise logs on the session tally: climbs per set, time on the wall, or circuit laps. */
export type TallyMeasure = "climbs" | "wallTime" | "laps";

export type CategoryShelf<T> = { kind: WorkoutKind; entries: T[] };

/** A starter exercise, named in the user's language. */
export type BuiltInExercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  measure: ExerciseMeasure;
};

/** What a picker row adds: the user's exercise, a built-in that becomes theirs, or a grip. */
export type PickerSource = { exercise: Exercise } | { builtIn: BuiltInExercise } | { grip: Grip };

/** One row of the exercise picker. */
export type PickerEntry = {
  key: string;
  kind: WorkoutKind;
  name: string;
  /** Sessions it was logged in. */
  uses: number;
  /** Whether it is from the starter library rather than the user's own. */
  library: boolean;
  inWorkout: boolean;
  source: PickerSource;
};

/** Which entries a picker shows: a category or all of them, and what was typed. */
export type PickerFilter = { category: WorkoutKind | "all"; text: string };

/** What the exercise editor asks for. A Fingers exercise takes a grip's measure. */
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
