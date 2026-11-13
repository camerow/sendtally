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

/** Starts whatever `to` opens, once whatever already runs is dealt with. */
export function useStartLive(): (to: string) => void {
  const navigate = useNavigate();
  const session = useLiveSessionStorage();
  const store = useLiveRunStore();
  return React.useCallback(
    (to: string) => {
      const go = (path: string): void => void navigate(path, { replace: reviewingLive() });
      startLive(running(session, store, go), () => go(to));
    },
    [navigate, session, store]
  );
}

/** Starts a new live session, once whatever already runs is dealt with. */
export function useStartLiveSession(): () => void {
  const start = useStartLive();
  return React.useCallback(() => start(LIVE_PATH), [start]);
}
