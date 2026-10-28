import type { ExerciseMeasure } from "@sendtally/core/hang";

/** An exercise picked for a workout, as its item names it, and how it is measured when it is the user's own. */
export type Picked = { exercise: string; measure?: ExerciseMeasure };
