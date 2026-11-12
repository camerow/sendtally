import { router, type Href } from "expo-router";
import type { ItemDone } from "@sendtally/core/hang";
import {
  activityFormParams,
  finishedRunParams,
  runParams,
  type RunFiling,
  type WorkoutRun,
} from "@sendtally/features/workouts";

export type RunPlayer = "/workout/sets" | "/workout/checklist";

export function runPath(player: RunPlayer, r: WorkoutRun): Href {
  return { pathname: player, params: runParams(r) };
}

/**
 * The review for a workout, with what was done in place of what it prescribes when given, and
 * the sets of it a player did not finish.
 */
export function activityFormPath(
  r: RunFiling & Pick<WorkoutRun, "date" | "minutes">,
  done?: readonly ItemDone[],
  startTime?: string,
  off: readonly string[] = []
): { pathname: "/activity/new"; params: Record<string, string> } {
  return { pathname: "/activity/new", params: activityFormParams(r, done, startTime, off) };
}

/**
 * Hands a finished run to its review, in place of the player, to check its sets, take an effort
 * and save, timed by the player's clock from its start.
 */
export function logRun(
  r: RunFiling,
  done: readonly ItemDone[],
  startedAt: number,
  off: readonly string[] = []
): void {
  router.replace({
    pathname: "/activity/new",
    params: finishedRunParams(r, done, startedAt, Date.now(), off),
  });
}
