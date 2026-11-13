import { sessionItems, type CalendarDate } from "@sendtally/core/hang";
import { NO_PLAN } from "@sendtally/features/training";
import {
  activityFormParams,
  activityKindOf,
  timerParams,
  type LibraryWorkout,
  type PlannedItems,
} from "@sendtally/features/workouts";
import { withParams } from "./paths";

/**
 * Where Log it goes for a workout's next session, unplanned: its review with every set ticked
 * at the dose. None for a workout with nothing in it. A hangboard workout logs on its first grip.
 */
export function logLink(w: LibraryWorkout, date: CalendarDate, session: number): string | null {
  return plannedLogLink(w, date, {
    link: { ...NO_PLAN, focus: w.focus },
    session,
    items: sessionItems(w.items, session),
  });
}

/** Where Log it goes for one planned run: its review with what the plan prescribes ticked. */
export function plannedLogLink(
  w: LibraryWorkout,
  date: CalendarDate,
  { link, session, items }: PlannedItems
): string | null {
  if (items.length === 0) return null;
  const kind = activityKindOf(w.kind);
  if (kind === null)
    return withParams(
      "/app/workout/done",
      timerParams(w.id, items[0]?.exercise ?? "", session, link)
    );
  return withParams("/app/activity/new", {
    ...activityFormParams({ kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes }),
    session: String(session),
  });
}
