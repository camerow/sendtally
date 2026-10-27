import { router } from "expo-router";
import { intervalsOf, type CalendarDate, type Item, type PlanLink } from "@sendtally/core/hang";
import { activityKindOf, type LibraryWorkout } from "@sendtally/features/workouts";
import { NO_PLAN } from "../data/planLinkParams";
import { activityFormPath, runPath, type RunPlayer } from "../data/workoutRunParams";
import { startIntervals } from "../intervals/intervalsParams";
import { startWorkout } from "../timer/startWorkout";

/** A run of a workout planned on a day: the plan it is in, and what that day prescribes. */
export type PlannedItems = { link: PlanLink; items: readonly Item[] };

const itemsOf = (w: LibraryWorkout, planned: PlannedItems | undefined): readonly Item[] =>
  planned?.items ?? w.variations[planned?.link.variation ?? 0]?.items ?? [];

const playerOf = (items: readonly Item[]): RunPlayer =>
  items.some((i) => i.dose.reps !== undefined || i.dose.weightKg !== undefined)
    ? "/workout/sets"
    : "/workout/checklist";

/**
 * Runs a workout in the player its items call for: hangboard in the timer, all timed in
 * the intervals player, reps or weight in the sets table, anything else as a checklist.
 * Climbing opens the session form, and a workout with no items the activity form.
 */
export function startLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  planned?: PlannedItems
): void {
  const link = planned?.link ?? NO_PLAN;
  const items = itemsOf(w, planned);
  const kind = activityKindOf(w.kind);
  const [first] = items;
  if (w.kind === "hangboard" && first !== undefined) {
    startWorkout(w.id, first.exercise, link);
    return;
  }
  if (kind === null) {
    // ponytail: the session form does not take a plan link yet; the day still counts as done.
    router.push("/session/new");
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
