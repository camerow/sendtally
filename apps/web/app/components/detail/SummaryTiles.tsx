import React from "react";
import type { Stat } from "@sendtally/features/activities";

/** The headline numbers side by side: value over label. */
export function SummaryTiles({ stats }: { stats: readonly Stat[] }): React.ReactElement {
  return (
    <div className="detail-tiles">
      {stats.map((s) => (
        <div key={s.label} className="detail-tile">
          <span className="detail-tile-value">{s.value}</span>
          <span className="detail-tile-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
