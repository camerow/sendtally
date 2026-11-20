import type { LoggedItem, Occurrence } from "@sendtally/features/training";
import { plannedItems } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { workoutPath } from "../library/useLibrary";
import { activityPath } from "../log/paths";
import { plannedLogLink } from "../log/logLink";

/** What was logged, on its page: a hangboard session or activity on its own, a climbing session on its own. */
export function loggedPath(item: LoggedItem): string {
  if (item.kind === "hang") return activityPath(item.session.id);
  if (item.kind === "activity") return activityPath(item.activity.id);
  return `/app/sessions/${encodeURIComponent(item.session.fingerprint)}`;
}

/** Log it for one planned run; none for a workout with nothing in it. */
export const occurrenceLogLink = (w: LibraryWorkout, o: Occurrence): string | null =>
  plannedLogLink(w, o.date, plannedItems(o));

/** A planned run's workout page: that day's session, started and logged for that run. */
export const occurrencePath = (o: Occurrence): string =>
  `${workoutPath(o.membership.workoutId)}?${new URLSearchParams({
    date: o.date,
    membershipId: o.membership.id,
  })}`;
