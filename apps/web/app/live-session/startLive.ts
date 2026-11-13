import type { DraftStorage } from "@sendtally/features/log-session";
import {
  runningNow,
  type LiveRun,
  type LiveRunStore,
  type Running,
} from "@sendtally/features/workouts";

export const LIVE_PATH = "/app/sessions/live";

/** Where a live run opens again; `end` ends it on the way, straight to its review. */
export const runPath = (run: Pick<LiveRun, "pathname" | "params">, end = false): string =>
  `/app${run.pathname}?${new URLSearchParams(end ? { ...run.params, end: "1" } : run.params)}`;

/** The live climbing session, else the workout run, if one runs. */
export function running(
  session: DraftStorage,
  store: LiveRunStore,
  go: (to: string) => void
): Running | null {
  return runningNow(session, store, (run, finish) =>
    go(run !== null ? runPath(run, finish) : finish ? `${LIVE_PATH}?finish=1` : LIVE_PATH)
  );
}
