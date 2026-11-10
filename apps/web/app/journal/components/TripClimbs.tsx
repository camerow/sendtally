import React from "react";
import type { SessionClimb } from "@sendtally/api-client";
import { climbMetaLabel, climbVMs } from "@sendtally/features/session-detail";
import { useDisplayScales } from "@sendtally/features/settings";

/** The climbs of one session, set under its row. */
export function TripClimbs({ climbs }: { climbs: SessionClimb[] }): React.ReactElement | null {
  const scales = useDisplayScales();
  if (climbs.length === 0) return null;
  return (
    <ul className="trip-climbs">
      {climbVMs(climbs, scales).map((c) => (
        <li key={c.n} className="trip-climb">
          <span className="trip-climb-name">{c.name}</span>
          <span className="trip-climb-meta">
            {c.endurance === undefined ? climbMetaLabel(c) : ""}
          </span>
          <span className="trip-climb-grade">{c.gradeLabel}</span>
          <span className="trip-climb-result">
            {c.endurance === undefined ? c.resultLabel : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
