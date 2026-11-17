import { router, type Href } from "expo-router";
import { intervalsParams, type IntervalsRun } from "@sendtally/features/workouts";
import { startLive } from "../../live-session/startLive";

export function intervalsPath(r: IntervalsRun): Href {
  return { pathname: "/workout/intervals", params: intervalsParams(r) };
}

/** Runs it in the intervals player in place of the workout page, once whatever already runs is dealt with. */
export function startIntervals(r: IntervalsRun): void {
  startLive(() => router.replace(intervalsPath(r)));
}
