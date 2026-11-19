import type { Href } from "expo-router";
import {
  liveRunStore,
  useLiveRun as useStoredRun,
  type LiveRun,
} from "@sendtally/features/workouts";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveRunStorage } from "../../lib/liveRunStorage";

/** This phone's live run, kept with the signed-in user's drafts. */
export const liveRun = liveRunStore(liveRunStorage, exerciseTallyStorage);

export const useLiveRun = (): LiveRun | null => useStoredRun(liveRun);

/**
 * Opens the run again; `end` ends it on the way, straight to its review. A checklist run, from
 * before the sets player took checklists over, opens in the sets player.
 */
export function liveRunHref(run: LiveRun, end = false): Href {
  return {
    pathname: run.pathname === "/workout/checklist" ? "/workout/sets" : run.pathname,
    params: end ? { ...run.params, end: "1" } : run.params,
  };
}
