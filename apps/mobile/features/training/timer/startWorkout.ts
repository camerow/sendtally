import { router } from "expo-router";
import type { PlanLink } from "@sendtally/core/hang";
import { startLive } from "../../live-session/startLive";
import { NO_PLAN } from "@sendtally/features/training";
import { timerParams } from "@sendtally/features/workouts";

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
  startLive(() =>
    router.push({
      pathname: "/workout/timer",
      params: timerParams(workoutId, gripId, session, link),
    })
  );
}
