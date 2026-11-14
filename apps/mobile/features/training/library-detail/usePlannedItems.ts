import { unplannedItems, type LibraryWorkout } from "@sendtally/features/workouts";
import { useNextSession } from "../library/useLibrary";
import type { PlannedItems } from "./startLibraryWorkout";

/** What the plan prescribes; else the workout's next session as written. */
export function usePlannedItems(workout: LibraryWorkout, planned?: PlannedItems): PlannedItems {
  const session = useNextSession(workout.id);
  return planned ?? unplannedItems(workout, session);
}
