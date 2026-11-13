import React from "react";
import { useNavigate } from "react-router";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { LIVE_PATH, running, startLive } from "./startLive";

/** Starts a new live session, once whatever already runs is dealt with. */
export function useStartLiveSession(): () => void {
  const navigate = useNavigate();
  const storage = useLiveSessionStorage();
  return React.useCallback(() => {
    const go = (to: string): void => void navigate(to);
    startLive(running(storage, go), () => go(LIVE_PATH));
  }, [navigate, storage]);
}
