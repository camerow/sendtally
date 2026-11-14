import { router } from "expo-router";
import type { CalendarDate } from "@sendtally/core/hang";
import type { TallyMeasure } from "@sendtally/features/exercises";
import {
  activityKindOf,
  timerParams,
  workoutStart,
  type LibraryWorkout,
  type PlannedItems,
} from "@sendtally/features/workouts";
import { activityFormPath, runPath } from "../data/workoutRunParams";
import { startIntervals } from "../intervals/intervalsParams";
import { startLive } from "../../live-session/startLive";
import { startLiveSession } from "../../live-session/startLiveSession";
import { startWorkout } from "../timer/startWorkout";

export type { PlannedItems };

/** Runs a workout in the player its items call for (see `workoutStart`). */
export function startLibraryWorkout(
  w: LibraryWorkout,
  date: CalendarDate,
  planned: PlannedItems,
  eachSide: (exercise: string) => boolean,
  tally?: (exercise: string) => TallyMeasure | null
): void {
  const { link, session } = planned;
  const start = workoutStart(w, date, planned, eachSide, tally);
  switch (start.open) {
    case "timer":
      return startWorkout(w.name, w.id, start.gripId, session, link);
    case "liveSession":
      return startLiveSession(link.membershipId === null ? undefined : link, w.name);
    case "form":
      return router.push(activityFormPath(start.run));
    case "intervals":
      return startIntervals(start.run);
    default: {
      const { run } = start;
      const player = start.open === "sets" ? "/workout/sets" : "/workout/checklist";
      return startLive(() => router.push(runPath(player, run)));
    }
  }
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
    router.push({ pathname: "/workout/done", params: timerParams(w.id, grip, session, link) });
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
