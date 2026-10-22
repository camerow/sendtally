import type { LibraryWorkout } from "@sendtally/features/workouts";
import type { PlanAt, PlanRequest } from "./types";

/** The sheet that plans a library workout: the hangboard planner, or a plan item's form running it. */
export function planFromWorkout(w: LibraryWorkout, { days, start, blockId }: PlanAt): PlanRequest {
  if (w.category === "hang") {
    return {
      mode: "hang",
      request: { mode: "new", workoutId: w.id, gripId: null, days, start, blockId },
    };
  }
  return {
    mode: "item",
    request: { mode: "new", kind: w.category, days, start, blockId, workout: w },
  };
}
