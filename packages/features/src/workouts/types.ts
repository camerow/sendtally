import type { WorkoutInput } from "@sendtally/api-client";
import type { CalendarDate, Focus, Workout } from "@sendtally/core/hang";

export type LibrarySource = "library" | "mine";

/** One workout in the library, built in or the user's own, of any kind. */
export type LibraryWorkout = Workout & { source: LibrarySource };

/** A workout as the user saves it. The apps always send a focus; null clears it. */
export type WorkoutDraft = Omit<WorkoutInput, "focus"> & Pick<Workout, "focus">;

export type WorkoutUse = { count: number; last: CalendarDate | null };

/** One focus's row in the library, General for none. */
export type LibraryShelf = { focus: Focus | null; workouts: LibraryWorkout[] };
