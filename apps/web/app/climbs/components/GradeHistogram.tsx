import React from "react";
import { t } from "@sendtally/features/i18n";
import type { GradeBinVM, GradeRange } from "@sendtally/features/trends";

const BAR_MAX = 84;

/** A bar per grade with its count on top; the picked range is solid, the rest pale. */
export function GradeHistogram({
  bins,
  range,
  onTap,
}: {
  bins: readonly GradeBinVM[];
  range: GradeRange | null;
  onTap: (rank: number) => void;
}): React.ReactElement {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const within = (rank: number): boolean =>
    range === null || (rank >= range.lo && rank <= range.hi);
  const picked = (rank: number): boolean => range !== null && within(rank);
  return (
    <div className="histogram">
      <div className="histogram-bars">
        {bins.map((b) => (
          <button
            key={b.rank}
            type="button"
            className="histogram-bin"
            aria-pressed={picked(b.rank)}
            aria-label={t("trends.gradeBin", {
              grade: b.label,
              climbs: t("common.climbCount", { count: b.count }),
            })}
            onClick={() => onTap(b.rank)}
          >
            <span className="histogram-count">{b.count === 0 ? "" : b.count}</span>
            <span
              className={within(b.rank) ? "histogram-bar" : "histogram-bar histogram-bar--out"}
              style={{
                height: b.count === 0 ? 2 : Math.max(3, Math.round((b.count / max) * BAR_MAX)),
              }}
            />
          </button>
        ))}
      </div>
      <div className="histogram-labels" aria-hidden>
        {bins.map((b) => (
          <span
            key={b.rank}
            className={picked(b.rank) ? "histogram-label histogram-label--on" : "histogram-label"}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
