import type { WorkoutKind } from "@sendtally/core/hang";

export type CategoryShelf<T> = { kind: WorkoutKind; entries: T[] };
