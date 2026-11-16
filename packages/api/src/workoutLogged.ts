import type { Context } from "hono";
import { BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { type AppEnv, captureEvent } from "./context";
import * as repo from "./lib/repo";

const BUILT_IN = new Set<string>(BUILT_IN_WORKOUTS.map((w) => w.id));

/**
 * A workout logged for the first time: whether the plan asked for it, and whether it is a
 * built-in. The workout is the log's own, else the one its plan schedules; a log of neither,
 * such as a free-form activity or a climbing session with no plan, is not a workout.
 */
export async function captureWorkoutLogged(
  c: Context<AppEnv>,
  log: { workoutId?: string | null; membershipId?: string | null | undefined }
): Promise<void> {
  const membershipId = log.membershipId ?? null;
  const workoutId =
    log.workoutId ??
    (membershipId === null
      ? null
      : ((await repo.getMembership(c.env.DB, c.get("userId"), membershipId))?.workout_id ?? null));
  if (workoutId === null) return;
  await captureEvent(c, "workout_logged", {
    built_in: BUILT_IN.has(workoutId),
    planned: membershipId !== null,
  });
}
