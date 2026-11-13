import type { TallyMeasure } from "../exercises/types";
import {
  intervalsOf,
  sessionItems,
  type CalendarDate,
  type PlanLink,
  type SessionItem,
} from "@sendtally/core/hang";
import { NO_PLAN } from "../training/planLinkParams";
import { activityKindOf } from "./library";
import type { PlayerPath } from "./liveRun";
import {
  intervalsParams,
  runParams,
  timerParams,
  type IntervalsRun,
  type WorkoutRun,
} from "./runParams";
import type { LibraryWorkout } from "./types";

/**
 * One run of a workout: the plan it is in, if any, which session of the workout it is,
 * and what that session prescribes.
 */
export type PlannedItems = { link: PlanLink; session: number; items: readonly SessionItem[] };

/** A workout's `session`th run outside any plan, as the workout writes it. */
export const unplannedItems = (w: LibraryWorkout, session: number): PlannedItems => ({
  link: { ...NO_PLAN, focus: w.focus },
  session,
  items: sessionItems(w.items, session),
});

/** Where a workout opens when started, with what that place needs. */
export type WorkoutStart =
  | { open: "timer"; gripId: string }
  | { open: "liveSession" }
  | { open: "form"; run: Omit<WorkoutRun, "exerciseRestS" | "items"> }
  | { open: "intervals"; run: IntervalsRun }
  | { open: "sets" | "checklist"; run: WorkoutRun };

const playerOf = (items: readonly SessionItem[]): "sets" | "checklist" =>
  items.some((i) => i.dose.reps !== undefined || i.dose.weightKg !== undefined)
    ? "sets"
    : "checklist";

/**
 * The player a workout's items call for: hangboard in the timer, all timed in the
 * intervals player (climbing measured in time too, as laps), any exercise logged in climbs on
 * the tally or with reps or weight in the sets player, anything else as a checklist. A climbing
 * workout with no items opens the live session, and any other workout with none the activity
 * form. An exercise done on each side plays twice in the intervals player.
 */
export function workoutStart(
  w: LibraryWorkout,
  date: CalendarDate,
  { link, items }: PlannedItems,
  eachSide: (exercise: string) => boolean,
  tally: (exercise: string) => TallyMeasure | null = () => null
): WorkoutStart {
  const kind = activityKindOf(w.kind);
  const [first] = items;
  if (w.kind === "hangboard" && first !== undefined)
    return { open: "timer", gripId: first.exercise };
  if (kind === null || (kind === "climbing" && first === undefined)) return { open: "liveSession" };
  const run = { kind, title: w.name, date, workoutId: w.id, link, minutes: w.minutes };
  if (first === undefined) return { open: "form", run };
  const onTally = items.some((i) => tally(i.exercise) !== null);
  const climbs = items.some((i) => ["climbs", "laps"].includes(tally(i.exercise) ?? ""));
  if (!climbs && items.every((i) => i.dose.onS !== undefined))
    return { open: "intervals", run: { ...run, body: intervalsOf(items, eachSide) } };
  return {
    open: onTally ? "sets" : playerOf(items),
    run: { ...run, exerciseRestS: w.exerciseRestS, items: [...items] },
  };
}

/** The player a start opens and its params; none for the live session or the activity form. */
export function playerRoute(
  w: Pick<LibraryWorkout, "id">,
  start: WorkoutStart,
  { link, session }: PlannedItems
): { pathname: PlayerPath; params: Record<string, string> } | null {
  switch (start.open) {
    case "timer":
      return { pathname: "/workout/timer", params: timerParams(w.id, start.gripId, session, link) };
    case "intervals":
      return { pathname: "/workout/intervals", params: intervalsParams(start.run) };
    case "sets":
    case "checklist":
      return { pathname: `/workout/${start.open}`, params: runParams(start.run) };
    default:
      return null;
  }
}
