import type { Exercise } from "@sendtally/api-client";
import type { ExerciseKind } from "@sendtally/core/hang";
import { exerciseKey } from "../statistics/exercises";

/** What an exercise's info sheet shows. */
export type ExerciseAbout = { kind: ExerciseKind; name: string; description: string };

/** The info of the user's exercise a workout item names, under the name shown; none without a description. */
export function exerciseAbout(
  exercises: readonly Exercise[] | null,
  name: string,
  shown: string
): ExerciseAbout | undefined {
  const e = exercises?.find((x) => exerciseKey(x.name) === exerciseKey(name));
  return e === undefined || e.description === ""
    ? undefined
    : { kind: e.kind, name: shown, description: e.description };
}
