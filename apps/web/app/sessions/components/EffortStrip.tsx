import React from "react";
import type { EffortRange } from "@sendtally/features/journal";
import { gradeTap } from "@sendtally/features/trends";
import { effortScale } from "@sendtally/design/tokens";

/** Click one level, then another for a range; levels outside it fade. */
export function EffortStrip({
  value,
  onChange,
}: {
  value: EffortRange | null;
  onChange: (range: EffortRange) => void;
}): React.ReactElement {
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const within = (level: number): boolean =>
    value === null || (level >= value.lo && level <= value.hi);
  return (
    <div className="effort-strip">
      {effortScale.map((color, i) => {
        const level = i + 1;
        const picked = value !== null && within(level);
        return (
          <button
            key={level}
            type="button"
            className="effort-level"
            aria-label={`RPE ${level}`}
            aria-pressed={picked}
            onClick={() => {
              const next = gradeTap(anchor, level);
              setAnchor(next.anchor);
              onChange(next.grade);
            }}
          >
            <span
              className="effort-cell"
              style={{ background: color, opacity: within(level) ? 1 : 0.22 }}
            />
            <span className={picked ? "effort-number effort-number--on" : "effort-number"}>
              {level}
            </span>
          </button>
        );
      })}
    </div>
  );
}
