import { router } from "expo-router";
import { intervalsOf, type CalendarDate, type Item, type PlanLink } from "@sendtally/core/hang";
import { activityKindOf, type LibraryWorkout } from "@sendtally/features/workouts";
import { NO_PLAN, planLinkParams } from "../data/planLinkParams";
import { startIntervals } from "../intervals/intervalsParams";
import { startWorkout } from "../timer/startWorkout";

/** A run of a workout planned on a day: the plan it is in, and what that day prescribes. */
export type PlannedItems = { link: PlanLink; items: readonly Item[] };

const itemsOf = (w: LibraryWorkout, planned: PlannedItems | undefined): readonly Item[] =>
  planned?.items ?? w.variations[planned?.link.variation ?? 0]?.items ?? [];

/** Logs a workout without running it: the session form for climbing, the activity form otherwise. */
export function logLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  link: PlanLink = NO_PLAN
): void {
  const kind = activityKindOf(w.kind);
  if (kind === null) {
    // ponytail: the session form does not take a plan link yet; the day still counts as done.
    router.push("/session/new");
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
      ...planLinkParams(link),
    },
  });
}

/**
 * Runs a workout: hangboard in the timer, timed items in the intervals player, and anything
 * else in the form that logs it, with what it prescribes filled in.
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
  if (kind !== null && first !== undefined && items.every((i) => i.dose.onS !== undefined)) {
    startIntervals({
      kind,
      title: w.name,
      date,
      activityId: null,
      workoutId: w.id,
      link,
      body: intervalsOf(items),
    });
    return;
  }
  logLibraryWorkout(w, date, link);
}

/** Whether starting runs a clock rather than opening a form. */
export const runsTimed = (w: LibraryWorkout, items: readonly Item[]): boolean =>
  items.length > 0 &&
  (w.kind === "hangboard" ||
    (activityKindOf(w.kind) !== null && items.every((i) => i.dose.onS !== undefined)));
