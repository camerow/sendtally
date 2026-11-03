import { router, type Href } from "expo-router";
import React from "react";
import { useLiveSession } from "@sendtally/features/log-session";
import { liveRunHref, readLiveRun } from "./liveRun";
import { liveSessionStorage } from "../../lib/liveSessionStorage";

/**
 * Where the system timer opens, `sendtally://live`: whatever is live when it is tapped, found
 * under the stack if it is already open, else home.
 */
export function LiveLink(): null {
  const session = useLiveSession(liveSessionStorage);
  const hasSession = session.stored?.draft !== undefined;
  React.useEffect(() => {
    const run = readLiveRun();
    const target: Href = hasSession
      ? "/session/live"
      : run !== null
        ? liveRunHref(run)
        : "/(tabs)/today";
    router.dismissTo(target);
  }, [hasSession]);
  return null;
}
