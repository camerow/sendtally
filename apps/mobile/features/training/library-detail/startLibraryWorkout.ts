import { router } from "expo-router";
import type { CalendarDate } from "@sendtally/core/hang";
import { activityKindOf, type LibraryWorkout } from "@sendtally/features/workouts";
import { startIntervals } from "../intervals/intervalsParams";

/**
 * Runs a workout other than a hangboard one: intervals in the player, a climbing session
 * in the session form, anything else in the activity form with its sets or checklist in.
 */
export function startLibraryWorkout(w: LibraryWorkout, date: CalendarDate): void {
  const kind = activityKindOf(w.category);
  if (kind === null) {
    router.push("/session/new");
    return;
  }
  if (w.body?.kind === "intervals") {
    startIntervals({
      kind,
      title: w.name,
      date,
      planItemId: null,
      activityId: null,
      workoutId: w.id,
      body: w.body,
    });
    return;
  }
  router.push({
    pathname: "/activity/new",
    params: {
      kind,
      title: w.name,
      date,
      workoutId: w.id,
      ...(w.minutes === null ? {} : { minutes: String(w.minutes) }),
    },
  });
}
