import type { SetDone } from "@sendtally/core/hang";

/** Sets that are holds and nothing else, whose one column is the hold. */
export const holdsOnly = (sets: readonly SetDone[]): boolean =>
  sets.length > 0 && sets.every((s) => s.onS !== undefined && s.reps === undefined);
