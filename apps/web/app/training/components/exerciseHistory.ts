import type { Exercise } from "@sendtally/api-client";
import { exerciseKey } from "@sendtally/features/statistics";
import { exercisePath } from "../exercises/paths";

/** Where an exercise's history opens; undefined for a typed name with no page of its own. */
export function exerciseHistoryPath(
  exercises: readonly Pick<Exercise, "id" | "name">[] | null,
  name: string
): string | undefined {
  const found = exercises?.find((e) => exerciseKey(e.name) === exerciseKey(name));
  return found === undefined ? undefined : exercisePath(found.id);
}
