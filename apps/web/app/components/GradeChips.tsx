import React from "react";

export type GradeChipsProps = {
  grades: readonly string[];
  active: string | null;
  /** The chip the row opens at, so the climber's range is in view; a pick never scrolls it. */
  startIndex: number;
  label: string;
  onPick: (grade: string) => void;
};

const CHIP = 56;
const GAP = 8;

/** A grade ladder as one sideways-scrolling row of chips. */
export function GradeChips({
  grades,
  active,
  startIndex,
  label,
  onPick,
}: GradeChipsProps): React.ReactElement {
  const row = React.useRef<HTMLDivElement>(null);
  const first = grades[0];
  const open = React.useEffectEvent(() => {
    if (row.current !== null) row.current.scrollLeft = Math.max(0, startIndex - 1) * (CHIP + GAP);
  });
  React.useEffect(() => open(), [first]);
  return (
    <div ref={row} className="grade-chips" role="radiogroup" aria-label={label}>
      {grades.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={g === active}
          className="grade-chip"
          onClick={() => onPick(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
