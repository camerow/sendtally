import {
  BUILT_IN_WORKOUTS,
  defaultExerciseRestS,
  type BuiltInItemSpec,
  type Item,
} from "@sendtally/core/hang";
import { builtInExerciseName } from "../exercises/builtIns";
import { t } from "../i18n";
import type { LibraryWorkout } from "./types";

const exerciseOf = (spec: BuiltInItemSpec): string => {
  if ("grip" in spec) return spec.grip;
  if ("step" in spec) return t(`workouts.step.${spec.step}`);
  return builtInExerciseName(spec.exercise);
};

const itemOf = (spec: BuiltInItemSpec): Item => ({
  exercise: exerciseOf(spec),
  doses: [...spec.doses],
});

export const BUILT_IN_WORKOUT_IDS: readonly string[] = BUILT_IN_WORKOUTS.map((w) => w.id);

/** The curated workouts, in the user's language. */
export function builtInWorkouts(): LibraryWorkout[] {
  return BUILT_IN_WORKOUTS.map((w) => ({
    id: w.id,
    source: "library",
    kind: w.kind,
    name: t(`workouts.builtIn.${w.id}.name`),
    description: t(`workouts.builtIn.${w.id}.blurb`),
    minutes: w.minutes,
    targetRpe: w.targetRpe,
    items: w.items.map(itemOf),
    exerciseRestS: defaultExerciseRestS(w.kind),
    focus: w.focus,
  }));
}
