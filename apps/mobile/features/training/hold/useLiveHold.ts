import React from "react";
import { readLiveRun, useLiveRun, writeLiveRunAsIs } from "../../live-session/liveRun";
import { finishedRun } from "./finishedRun";
import { holdEndsAt, type Hold } from "./holdClock";
import { playerHolds } from "./useHold";

/**
 * Records the live run's hold at its target while no player is open, so its rest runs on the
 * strip. Its cues play from the native timer. Mounted once, at the app's root.
 */
export function useLiveHold(): void {
  const hold = useLiveRun()?.hold;
  const key = hold === undefined || hold.pausedAt !== null ? null : JSON.stringify(hold);
  React.useEffect(() => {
    if (key === null) return;
    const h = JSON.parse(key) as Hold;
    const end = holdEndsAt(h);
    const finish = setTimeout(
      () => {
        const live = readLiveRun();
        if (playerHolds() || live?.hold === undefined) return;
        writeLiveRunAsIs(finishedRun(live, h.targetS, end));
      },
      Math.max(0, end - Date.now())
    );
    return () => clearTimeout(finish);
  }, [key]);
}
