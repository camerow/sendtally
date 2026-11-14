import type { DoseMeasure } from "./doseFields";
import type { WorkoutInput } from "@sendtally/api-client";
import type { CalendarDate, Dose, Focus, Workout } from "@sendtally/core/hang";

export type LibrarySource = "library" | "mine";

/** One workout in the library, built in or the user's own, of any kind. */
export type LibraryWorkout = Workout & { source: LibrarySource };

/** A workout as the user saves it. The apps always send a focus; null clears it. */
export type WorkoutDraft = Omit<WorkoutInput, "focus"> & Pick<Workout, "focus">;

export type WorkoutUse = { count: number; last: CalendarDate | null };

/** One focus's row in the library, General for none. */
export type LibraryShelf = { focus: Focus | null; workouts: LibraryWorkout[] };

/**
 * An exercise picked for a workout, as its item names it, how it is measured when it is the
 * user's own or a grip that pulls, and the dose a built-in it came from starts at.
 */
export type Picked = { exercise: string; measure?: DoseMeasure; dose?: Dose };
