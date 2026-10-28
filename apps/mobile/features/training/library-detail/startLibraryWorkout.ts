import { router } from "expo-router";
import {
  intervalsOf,
  type CalendarDate,
  type PlanLink,
  type SessionItem,
} from "@sendtally/core/hang";
import { activityKindOf, type LibraryWorkout } from "@sendtally/features/workouts";
import { activityFormPath, runPath, type RunPlayer } from "../data/workoutRunParams";
import { startIntervals } from "../intervals/intervalsParams";
import { startLiveSession } from "../../live-session/startLiveSession";
import { startWorkout } from "../timer/startWorkout";

/**
 * One run of a workout: the plan it is in, if any, which session of the workout it is,
 * and what that session prescribes.
 */
export type PlannedItems = { link: PlanLink; session: number; items: readonly SessionItem[] };

const playerOf = (items: readonly SessionItem[]): RunPlayer =>
  items.some((i) => i.dose.reps !== undefined || i.dose.weightKg !== undefined)
    ? "/workout/sets"
    : "/workout/checklist";

/**
 * Runs a workout in the player its items call for: hangboard in the timer, all timed in
 * the intervals player, reps or weight in the sets table, anything else as a checklist.
 * Climbing opens the live session, and a workout with no items the activity form.
 */
export function startLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  { link, session, items }: PlannedItems
): void {
  const kind = activityKindOf(w.kind);
  const [first] = items;
  if (w.kind === "hangboard" && first !== undefined) {
    startWorkout(w.id, first.exercise, session, link);
    return;
  }
  if (kind === null) {
    startLiveSession(link.membershipId === null ? undefined : link, w.name);
    return;
  }
  const run = { kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes };
  if (first === undefined) {
    router.push(activityFormPath(run));
    return;
  }
  if (items.every((i) => i.dose.onS !== undefined)) {
    startIntervals({ ...run, activityId: null, body: intervalsOf(items) });
    return;
  }
  router.push(
    runPath(playerOf(items), { ...run, exerciseRestS: w.exerciseRestS, items: [...items] })
  );
}
