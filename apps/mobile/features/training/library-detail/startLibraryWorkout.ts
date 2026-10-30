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
import { startLive } from "../../live-session/startLive";
import { startLiveSession } from "../../live-session/startLiveSession";
import { startWorkout, timerParams } from "../timer/startWorkout";

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
 * Runs a workout in the player its items call for: hangboard in the timer, any exercise
 * logged on the tally or with reps or weight in the sets player, all timed in the intervals
 * player, anything else as a checklist. A climbing workout with no items opens the live
 * session, and any other workout with none the activity form. An exercise done on each side
 * plays twice in the intervals player.
 */
export function startLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  { link, session, items }: PlannedItems,
  eachSide: (exercise: string) => boolean,
  tallied: (exercise: string) => boolean = () => false
): void {
  const kind = activityKindOf(w.kind);
  const [first] = items;
  if (w.kind === "hangboard" && first !== undefined) {
    startWorkout(w.name, w.id, first.exercise, session, link);
    return;
  }
  if (kind === null || (kind === "climbing" && first === undefined)) {
    startLiveSession(link.membershipId === null ? undefined : link, w.name);
    return;
  }
  const run = { kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes };
  if (first === undefined) {
    router.push(activityFormPath(run));
    return;
  }
  const onTally = items.some((i) => tallied(i.exercise));
  if (!onTally && items.every((i) => i.dose.onS !== undefined)) {
    startIntervals({ ...run, activityId: null, body: intervalsOf(items, eachSide) });
    return;
  }
  const player = onTally ? "/workout/sets" : playerOf(items);
  startLive(w.name, () =>
    router.push(runPath(player, { ...run, exerciseRestS: w.exerciseRestS, items: [...items] }))
  );
}

/**
 * Logs a workout without running it: its review, with every set ticked at the planned dose.
 * A hangboard workout logs on `gripId` when given, its first item's grip otherwise.
 */
export function logLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  { link, session, items }: PlannedItems,
  gripId?: string
): void {
  const kind = activityKindOf(w.kind);
  if (kind === null) {
    const grip = gripId ?? items[0]?.exercise ?? "";
    router.push({
      pathname: "/workout/done",
      params: { ...timerParams(w.id, grip, session, link), logIt: "1" },
    });
    return;
  }
  const path = activityFormPath({
    kind,
    title: w.name,
    date,
    workoutId: w.id,
    link,
    minutes: w.minutes,
  });
  router.push({ ...path, params: { ...path.params, session: String(session) } });
}
