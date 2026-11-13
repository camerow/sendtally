import { sessionItems, type CalendarDate } from "@sendtally/core/hang";
import { NO_PLAN } from "@sendtally/features/training";
import {
  activityFormParams,
  activityKindOf,
  timerParams,
  type LibraryWorkout,
} from "@sendtally/features/workouts";

/**
 * Where Log it goes for a workout's next session, unplanned: its review with every set ticked
 * at the dose. None for a workout with nothing in it. A hangboard workout logs on its first grip.
 */
export function logLink(w: LibraryWorkout, date: CalendarDate, session: number): string | null {
  const items = sessionItems(w.items, session);
  if (items.length === 0) return null;
  const link = { ...NO_PLAN, focus: w.focus };
  const kind = activityKindOf(w.kind);
  if (kind === null)
    return `/app/workout/done?${new URLSearchParams(timerParams(w.id, items[0]?.exercise ?? "", session, link))}`;
  return `/app/activity/new?${new URLSearchParams({
    ...activityFormParams({ kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes }),
    session: String(session),
  })}`;
}
