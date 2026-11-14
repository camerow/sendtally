import type { PlanLink } from "@sendtally/core/hang";
import { usePlannedRun as usePlanned, type PlannedRun } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useHangData } from "../data/HangDataContext";

export type { PlannedItem, PlannedRun } from "@sendtally/features/workouts";

/** What the timer runs for this workout, from the signed-in user's training. */
export function usePlannedRun(
  workoutId: string,
  link: PlanLink,
  session: number
): PlannedRun | undefined {
  return usePlanned(useApi(), useHangData().model, workoutId, link, session);
}
