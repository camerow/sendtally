import React from "react";

export type GradeChip = { key: string; label: string; colour?: string };

export type GradeChipsProps = {
  chips: readonly GradeChip[];
  active: string | null;
  /** The chip the row opens at, so the climber's range is in view; a pick never scrolls it. */
  startIndex: number;
  label: string;
  /** White on the live tally's dark ground; soft grey on a form. */
  dark?: boolean;
  onPick: (key: string) => void;
};

const CHIP = 56;
const GAP = 8;

/** A grade ladder, or a gym's circuit colours, as one sideways-scrolling row of chips. */
export function GradeChips({
  chips,
  active,
  startIndex,
  label,
  dark = false,
  onPick,
}: GradeChipsProps): React.ReactElement {
  const row = React.useRef<HTMLDivElement>(null);
  const first = chips[0]?.key;
  const open = React.useEffectEvent(() => {
    if (row.current !== null) row.current.scrollLeft = Math.max(0, startIndex - 1) * (CHIP + GAP);
  });
  React.useEffect(() => open(), [first]);
  return (
    <div
      ref={row}
      className={dark ? "grade-chips grade-chips--dark" : "grade-chips"}
      role="radiogroup"
      aria-label={label}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          role="radio"
          aria-checked={chip.key === active}
          aria-label={chip.label}
          className={chip.colour === undefined ? "grade-chip" : "grade-chip grade-chip--colour"}
          style={chip.colour === undefined ? undefined : { background: chip.colour }}
          onClick={() => onPick(chip.key)}
        >
          {chip.colour === undefined ? chip.label : ""}
        </button>
      ))}
    </div>
  );
}
