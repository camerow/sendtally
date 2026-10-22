import type { WorkoutInput } from "@sendtally/api-client";
import type { CalendarDate, Workout } from "@sendtally/core/hang";

export type LibrarySource = "library" | "mine";

/** One workout in the library, built in or the user's own, of any kind. */
export type LibraryWorkout = Workout & { source: LibrarySource };

/** A workout as the user saves it. */
export type WorkoutDraft = WorkoutInput;

export type WorkoutUse = { count: number; last: CalendarDate | null };

/** The library as one list shows it: the user's own by last use, the built-ins below. */
export type LibraryShelves = { mine: LibraryWorkout[]; builtIn: LibraryWorkout[] };
