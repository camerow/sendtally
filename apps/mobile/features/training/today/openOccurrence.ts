import { router } from "expo-router";
import type { Occurrence } from "@sendtally/features/training";

/** A planned run's workout, opened as that run: its day, and Start and Log it for it. */
export function openOccurrence(o: Occurrence): void {
  router.push({
    pathname: "/workout/[id]",
    params: { id: o.membership.workoutId, date: o.date, membershipId: o.membership.id },
  });
}
