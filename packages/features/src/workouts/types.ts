import type { WorkoutInput } from "@sendtally/api-client";
import type { CalendarDate, Workout, WorkoutKind } from "@sendtally/core/hang";

export type LibrarySource = "library" | "mine";

/** One workout in the library, built in or the user's own, of any kind. */
export type LibraryWorkout = Workout & { source: LibrarySource };

/** A workout as the user saves it. */
export type WorkoutDraft = WorkoutInput;

export type WorkoutUse = { count: number; last: CalendarDate | null };

/** One category's row in the library. */
export type LibraryShelf = { kind: WorkoutKind; workouts: LibraryWorkout[] };
