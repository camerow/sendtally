import type { CalendarDate } from "@sendtally/core/hang";
import {
  activityFormParams,
  activityKindOf,
  unplannedItems,
  type LibraryWorkout,
  type PlannedItems,
} from "@sendtally/features/workouts";
import { donePath, newActivityPath } from "./paths";

/**
 * Where Log it goes for a workout's next session, unplanned: its review with every set ticked
 * at the dose. None for a workout with nothing in it. A hangboard workout logs on its first grip.
 */
export function logLink(w: LibraryWorkout, date: CalendarDate, session: number): string | null {
  return plannedLogLink(w, date, unplannedItems(w, session));
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
    return donePath({
      workoutId: w.id,
      gripId: items[0]?.exercise ?? "",
      link,
      session,
      run: null,
    });
  return newActivityPath({
    ...activityFormParams({ kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes }),
    session: String(session),
  });
}
