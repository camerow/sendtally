import { BUILT_IN_EXERCISES, type BuiltInExerciseId, type Dose } from "@sendtally/core/hang";
import { inEveryLocale, t } from "../i18n";
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

const nameKey = (name: string): string => name.trim().toLowerCase();

/** The built-ins the user has not made their own, by link or by a live exercise of the same name. */
export function unclaimedBuiltIns(
  mine: readonly { name: string; builtIn: string | null; archived: boolean }[]
): BuiltInExercise[] {
  const linked = new Set(mine.map((e) => e.builtIn));
  const taken = new Set(mine.filter((e) => !e.archived).map((e) => nameKey(e.name)));
  return builtInExercises().filter((b) => !linked.has(b.id) && !taken.has(nameKey(b.name)));
}

/** A built-in exercise by id, in the user's language. */
export const builtInExercise = (id: string): BuiltInExercise | undefined =>
  builtInExercises().find((b) => b.id === id);

/** What a workout item of an exercise picked from the built-ins starts at, when it says. */
export const builtInDose = (builtIn: string | null): Dose | undefined => {
  const b = builtInOf(builtIn);
  return b !== undefined && "dose" in b ? b.dose : undefined;
};

/** An exercise as the user reads it: one picked from the built-ins in their language, until they rename it. */
export function exerciseLabel(e: { name: string; builtIn: string | null }): string {
  const builtIn = builtInOf(e.builtIn);
  if (builtIn === undefined) return e.name;
  const renamed = !inEveryLocale(`workouts.exercise.${builtIn.id}`).some(
    (name) => nameKey(name) === nameKey(e.name)
  );
  return renamed ? e.name : builtInExerciseName(builtIn.id);
}
