import { router } from "expo-router";
import type { Exercise } from "@sendtally/api-client";
import { exerciseKey } from "@sendtally/features/statistics";

/** Opens an exercise's history screen; undefined for a typed name with no screen of its own. */
export function openExerciseHistory(
  exercises: readonly Pick<Exercise, "id" | "name">[] | null,
  name: string
): (() => void) | undefined {
  const found = exercises?.find((e) => exerciseKey(e.name) === exerciseKey(name));
  return found === undefined
    ? undefined
    : () => router.push({ pathname: "/exercise/[id]", params: { id: found.id } });
}
