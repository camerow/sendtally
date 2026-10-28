import { router } from "expo-router";
import type { PlanLink } from "@sendtally/core/hang";
import { NO_PLAN, planLinkParams } from "../data/planLinkParams";

/**
 * Runs a hangboard workout in the timer as its `session`th session, against the plan it
 * was planned in when it was.
 */
export function startWorkout(
  workoutId: string,
  gripId: string,
  session: number,
  link: PlanLink = NO_PLAN
): void {
  router.push({
    pathname: "/workout/timer",
    params: { workoutId, gripId, session: String(session), ...planLinkParams(link) },
  });
}
