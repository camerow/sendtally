import React from "react";
import { useNavigate } from "react-router";
import { useLiveRunStore } from "../lib/useLiveRun";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { startLive } from "@sendtally/features/workouts";
import { LIVE_PATH, running } from "./startLive";

/** A live run's review, which whatever waited on it replaces once it is saved or thrown away. */
const reviewingLive = (): boolean =>
  window.location.pathname === "/app/activity/new" &&
  new URLSearchParams(window.location.search).get("live") === "1";

/**
 * Starts whatever `to` opens, once whatever already runs is dealt with; with `replace`, in place
 * of the page it starts from.
 */
export function useStartLive(): (to: string, replace?: boolean) => void {
  const navigate = useNavigate();
  const session = useLiveSessionStorage();
  const store = useLiveRunStore();
  return React.useCallback(
    (to: string, replace = false) => {
      const go = (path: string, ownPage = false): void =>
        void navigate(path, { replace: ownPage || reviewingLive() });
      startLive(running(session, store, go), () => go(to, replace));
    },
    [navigate, session, store]
  );
}

/** Starts a new live session, once whatever already runs is dealt with. */
export function useStartLiveSession(): () => void {
  const start = useStartLive();
  return React.useCallback(() => start(LIVE_PATH), [start]);
}
