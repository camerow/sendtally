import type { Exercise } from "@sendtally/api-client";
import type { ExerciseKind } from "@sendtally/core/hang";
import { exerciseKey } from "../statistics/exercises";
import { builtInExercises, exerciseDescription } from "./builtIns";

/** What an exercise's info sheet shows. */
export type ExerciseAbout = { kind: ExerciseKind; name: string; description: string };

/**
 * The info of the exercise a workout item names, under the name shown: the user's own, else the
 * built-in of that name; none without a description.
 */
export function exerciseAbout(
  exercises: readonly Exercise[] | null,
  name: string,
  shown: string
): ExerciseAbout | undefined {
  const key = exerciseKey(name);
  const mine = exercises?.find((x) => exerciseKey(x.name) === key);
  const e =
    mine === undefined
      ? builtInExercises().find((b) => exerciseKey(b.name) === key)
      : { kind: mine.kind, description: exerciseDescription(mine) };
  return e === undefined || e.description === ""
    ? undefined
    : { kind: e.kind, name: shown, description: e.description };
}
