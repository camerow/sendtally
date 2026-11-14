import { BUILT_IN_EXERCISES, type BuiltInExerciseId, type Dose } from "@sendtally/core/hang";
import { t } from "../i18n";
import type { BuiltInExercise } from "./types";

const builtInOf = (id: string | null): (typeof BUILT_IN_EXERCISES)[number] | undefined =>
  BUILT_IN_EXERCISES.find((b) => b.id === id);

/** A built-in exercise's name, in the user's language. */
export const builtInExerciseName = (id: BuiltInExerciseId): string => t(`workouts.exercise.${id}`);

/** The starter exercises, in the user's language. */
export const builtInExercises = (): BuiltInExercise[] =>
  BUILT_IN_EXERCISES.map(({ id, kind, measure }) => ({
    id,
    name: builtInExerciseName(id),
    kind,
    measure,
  }));

/** What a workout item of an exercise picked from the built-ins starts at, when it says. */
export const builtInDose = (builtIn: string | null): Dose | undefined => {
  const b = builtInOf(builtIn);
  return b !== undefined && "dose" in b ? b.dose : undefined;
};

/** An exercise as the user reads it: one picked from the built-ins in their language. */
export function exerciseLabel(e: { name: string; builtIn: string | null }): string {
  const builtIn = builtInOf(e.builtIn);
  return builtIn === undefined ? e.name : builtInExerciseName(builtIn.id);
}
