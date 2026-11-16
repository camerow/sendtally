import type { Context } from "hono";
import { BUILT_IN_WORKOUTS } from "@sendtally/core/hang";
import { type AppEnv, captureEvent } from "./context";
import * as repo from "./lib/repo";

const BUILT_IN = new Set<string>(BUILT_IN_WORKOUTS.map((w) => w.id));

type Log = { workoutId?: string | null; membershipId?: string | null | undefined };

async function capture(c: Context<AppEnv>, log: Log): Promise<void> {
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

/**
 * A workout logged for the first time: whether the plan asked for it, and whether it is a
 * built-in. The workout is the log's own, else the one its plan schedules; a log of neither,
 * such as a free-form activity or a climbing session with no plan, is not a workout. Runs after
 * the response and swallows its errors, so it never fails or slows the write it follows.
 */
export async function captureWorkoutLogged(c: Context<AppEnv>, log: Log): Promise<void> {
  const task = capture(c, log).catch((err: unknown) =>
    console.error("capture workout_logged", err)
  );
  try {
    c.executionCtx.waitUntil(task);
  } catch {
    await task;
  }
}
