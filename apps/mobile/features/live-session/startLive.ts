import { router } from "expo-router";
import { runningNow, startLive as startWhenFree, type Running } from "@sendtally/features/workouts";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { liveRun, liveRunHref } from "./liveRun";

export function running(): Running | null {
  return runningNow(liveSessionStorage, liveRun, (run, finish) =>
    router.push(
      run !== null
        ? liveRunHref(run, finish)
        : finish
          ? { pathname: "/session/live", params: { finish: "1" } }
          : "/session/live"
    )
  );
}

/** Starts a run, unless something already runs: then the climber picks what happens to it first. */
export function startLive(start: () => void): void {
  startWhenFree(running(), start);
}
