import React from "react";
import type { PyramidRow } from "@sendtally/features/climbs";

/** One centred bar per grade, hardest on top: the sent count dark, the rest split either side; counts share a column. */
export function Pyramid({
  rows,
  label,
}: {
  rows: readonly PyramidRow[];
  label: string;
}): React.ReactElement {
  const widest = Math.max(1, ...rows.map((r) => r.inner + r.outer));
  const share = (n: number): string => `${(n / widest) * 100}%`;
  return (
    <div className="pyramid" role="img" aria-label={label}>
      {rows.map((r) => (
        <React.Fragment key={r.gradeLabel}>
          <span className="pyramid-grade">{r.gradeLabel}</span>
          <span className="pyramid-bars">
            {r.outer > 0 && (
              <span
                className="pyramid-side pyramid-side--left"
                style={{ width: share(r.outer / 2) }}
              />
            )}
            {r.inner > 0 && (
              <span
                className={r.outer > 0 ? "pyramid-inner" : "pyramid-inner pyramid-inner--alone"}
                style={{ width: share(r.inner) }}
              />
            )}
            {r.outer > 0 && <span className="pyramid-side" style={{ width: share(r.outer / 2) }} />}
          </span>
          <span className="pyramid-count">{r.countLabel}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
