import React from "react";
import { runElapsedSeconds } from "@sendtally/features/workouts";
import { LiveClock } from "../../components/LiveClock";

/** The clock from Start, live. */
export function PlayerClock({ startedAt }: { startedAt: number }): React.ReactElement {
  return (
    <span className="player-clock">
      <span className="player-clock-dot" />
      <LiveClock
        elapsed={(now) => runElapsedSeconds(startedAt, now)}
        className="player-clock-time"
      />
    </span>
  );
}
