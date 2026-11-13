import type { LoggedItem, Occurrence } from "@sendtally/features/training";
import { occurrenceLink } from "@sendtally/features/training";
import type { LibraryWorkout, PlannedItems } from "@sendtally/features/workouts";
import { workoutPath } from "../library/useLibrary";
import { activityPath } from "../log/paths";
import { plannedLogLink } from "../log/logLink";

/** What was logged, on its page: a hangboard session or activity on its own, a climbing session on its own. */
export function loggedPath(item: LoggedItem): string {
  if (item.kind === "hang") return activityPath(item.session.id);
  if (item.kind === "activity") return activityPath(item.activity.id);
  return `/app/sessions/${encodeURIComponent(item.session.fingerprint)}`;
}

/** What the plan prescribes for one run. */
export const plannedOf = (o: Occurrence): PlannedItems => ({
  link: occurrenceLink(o),
  items: o.items,
  session: o.session,
});

/** Log it for one planned run; none for a workout with nothing in it. */
export const occurrenceLogLink = (w: LibraryWorkout, o: Occurrence): string | null =>
  plannedLogLink(w, o.date, plannedOf(o));

export const occurrencePath = (o: Occurrence): string => workoutPath(o.membership.workoutId);
