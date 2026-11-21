import React from "react";
import type { Weekday } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";

type WeekdayChipsProps = {
  days: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  /** Days drawn faint, still pressable. */
  dim?: readonly Weekday[];
};

/** A chip per weekday, Monday first, each on or off. */
export function WeekdayChips({ days, onToggle, dim = [] }: WeekdayChipsProps): React.ReactElement {
  return (
    <div className="weekday-chips">
      {weekdayLetters().map((letter, i) => {
        const day = i as Weekday;
        return (
          <button
            key={i}
            type="button"
            role="checkbox"
            aria-checked={days.includes(day)}
            aria-label={weekdayLong(i)}
            className="weekday-chip"
            style={dim.includes(day) ? { opacity: 0.35 } : undefined}
            onClick={() => onToggle(day)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
