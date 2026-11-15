import type { BuiltInWorkoutEntry } from "@sendtally/api-client";
import { defaultExerciseRestS, type BuiltInItemSpec, type Item } from "@sendtally/core/hang";
import { builtInExerciseName } from "../exercises/builtIns";
import { t } from "../i18n";
import { currentLibrary } from "../library/current";
import { entryDescription, entryName, findEntry, offered } from "../library/entries";
import type { LibraryWorkout } from "./types";

const itemOf = (spec: BuiltInItemSpec): Item => ({
  exercise:
    "grip" in spec
      ? spec.grip
      : "step" in spec
        ? t(`workouts.step.${spec.step}`)
        : builtInExerciseName(spec.exercise),
  doses: [...spec.doses],
});

const workoutOf = (w: BuiltInWorkoutEntry): LibraryWorkout => ({
  id: w.id,
  source: "library",
  kind: w.spec.kind,
  name: entryName(w),
  description: entryDescription(w),
  minutes: w.spec.minutes,
  targetRpe: w.spec.targetRpe,
  items: w.spec.items.map(itemOf),
  exerciseRestS: defaultExerciseRestS(w.spec.kind),
  focus: w.spec.focus,
});

/** The curated workouts the library offers, in the user's language. */
export const builtInWorkouts = (): LibraryWorkout[] =>
  offered(currentLibrary().workouts).map(workoutOf);

/** A curated workout by id, retired or not, in the user's language. */
export function builtInWorkout(id: string): LibraryWorkout | undefined {
  const entry = findEntry(currentLibrary().workouts, id);
  return entry === undefined ? undefined : workoutOf(entry);
}
