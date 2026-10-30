import { router } from "expo-router";
import type { PlanLink } from "@sendtally/core/hang";
import { startLive } from "../../live-session/startLive";
import { NO_PLAN, planLinkParams } from "../data/planLinkParams";

/** The timer's route params for a hangboard workout's `session`th session. */
export const timerParams = (
  workoutId: string,
  gripId: string,
  session: number,
  link: PlanLink = NO_PLAN
): Record<string, string> => ({
  workoutId,
  gripId,
  session: String(session),
  ...planLinkParams(link),
});

/**
 * Runs a hangboard workout in the timer as its `session`th session, against the plan it
 * was planned in when it was, once whatever already runs is dealt with.
 */
export function startWorkout(
  name: string,
  workoutId: string,
  gripId: string,
  session: number,
  link: PlanLink = NO_PLAN
): void {
  startLive(name, () =>
    router.push({
      pathname: "/workout/timer",
      params: timerParams(workoutId, gripId, session, link),
    })
  );
}
