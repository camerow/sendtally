import type { Exercise } from "@sendtally/api-client";

const key = (name: string): string => name.trim().toLowerCase();

/** Whether the exercise a workout item names is done on each side, by name in any case. */
export function eachSideOf(
  exercises: readonly Pick<Exercise, "name" | "eachSide">[]
): (name: string) => boolean {
  const sided = new Set(exercises.filter((e) => e.eachSide).map((e) => key(e.name)));
  return (name) => sided.has(key(name));
}
