import type { Href } from "expo-router";
import {
  liveRunStore,
  useLiveRun as useStoredRun,
  type Hold,
  type LiveRun,
  type PlayerPath,
  type Rest,
} from "@sendtally/features/workouts";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveRunStorage } from "../../lib/liveRunStorage";

export {
  liveRunSummary,
  parseLiveRun,
  type LiveRun,
  type PlayerPath,
  type RunState,
} from "@sendtally/features/workouts";

/** This phone's live run, kept with the signed-in user's drafts. */
export const liveRun = liveRunStore(liveRunStorage, exerciseTallyStorage);

export const readLiveRun = (): LiveRun | null => liveRun.read();
export const writeLiveRun = (run: LiveRun): void => liveRun.write(run);
export const writeLiveRunAsIs = (run: LiveRun): void => liveRun.writeAsIs(run);
export const writeRest = (rest: Rest | null): void => liveRun.writeRest(rest);
export const writeHold = (hold: Hold | null): void => liveRun.writeHold(hold);
export const resumedRun = (pathname: PlayerPath, workoutId: string | null): LiveRun | null =>
  liveRun.resumed(pathname, workoutId);
export const clearLiveRun = (): void => liveRun.clear();
export const useLiveRun = (): LiveRun | null => useStoredRun(liveRun);

/** Opens the run again; `end` ends it on the way, straight to its review. */
export function liveRunHref(run: LiveRun, end = false): Href {
  return {
    pathname: run.pathname,
    params: end ? { ...run.params, end: "1" } : run.params,
  };
}
