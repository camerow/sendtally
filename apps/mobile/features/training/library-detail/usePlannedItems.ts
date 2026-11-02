import { sessionItems } from "@sendtally/core/hang";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { NO_PLAN } from "../data/planLinkParams";
import { useNextSession } from "../library/useLibrary";
import type { PlannedItems } from "./startLibraryWorkout";

/** What the plan prescribes; else the workout's next session as written. */
export function usePlannedItems(workout: LibraryWorkout, planned?: PlannedItems): PlannedItems {
  const session = useNextSession(workout.id);
  return (
    planned ?? {
      link: { ...NO_PLAN, focus: workout.focus },
      session,
      items: sessionItems(workout.items, session),
    }
  );
}
