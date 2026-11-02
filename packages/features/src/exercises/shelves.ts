import { WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import type { CategoryShelf } from "./types";

/**
 * Every category, in category order and empty ones too, each holding its entries by name.
 * Archived entries stay out.
 */
export function categoryShelves<T extends { kind: WorkoutKind; name: string; archived?: boolean }>(
  entries: readonly T[]
): CategoryShelf<T>[] {
  return WORKOUT_KINDS.map((kind) => ({
    kind,
    entries: entries
      .filter((e) => e.kind === kind && e.archived !== true)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
