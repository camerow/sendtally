import React from "react";
import type { TrendStatVM } from "@sendtally/features/trends";

export function TrendStats({ stats }: { stats: TrendStatVM[] }): React.ReactElement {
  return (
    <div
      className="trend-stats"
      data-many={stats.length > 5}
      style={{ "--cols": stats.length } as React.CSSProperties}
    >
      {stats.map((s) => (
        <div key={s.key} className="trend-stat">
          <span className="trend-stat-label trend-mono">{s.label}</span>
          <span className="trend-stat-value">{s.value}</span>
          {s.lifetime !== null && <span className="trend-stat-life">{s.lifetime}</span>}
        </div>
      ))}
    </div>
  );
}
