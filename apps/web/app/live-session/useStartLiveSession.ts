import React from "react";
import { useNavigate } from "react-router";
import { useLiveRunStore } from "../lib/useLiveRun";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { LIVE_PATH, running, startLive } from "./startLive";

/** Starts whatever `to` opens, once whatever already runs is dealt with. */
export function useStartLive(): (to: string) => void {
  const navigate = useNavigate();
  const session = useLiveSessionStorage();
  const store = useLiveRunStore();
  return React.useCallback(
    (to: string) => {
      const go = (path: string): void => void navigate(path);
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
