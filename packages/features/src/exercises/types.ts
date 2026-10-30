import type { Exercise } from "@sendtally/api-client";
import type { ExerciseKind, ExerciseMeasure, Grip, WorkoutKind } from "@sendtally/core/hang";

/** How a climbing exercise logs on the session tally: climbs per set, or time on the wall. */
export type TallyMeasure = "climbs" | "wallTime";

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
