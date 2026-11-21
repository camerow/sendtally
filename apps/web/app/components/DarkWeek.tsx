import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { DayMark } from "../training/plan-week/DayMark";

/** Seven days on the dark ground, Monday first: lit where training lands, with each workout's mark. With `onToggle`, each day is the button that turns it on and off. */
export function DarkWeek({
  week,
  onToggle,
  dim = [],
}: {
  week: readonly (readonly WorkoutKind[] | null)[];
  onToggle?: (day: Weekday) => void;
  /** Days drawn quieter that still work, such as those the user did not say they can train. */
  dim?: readonly Weekday[];
}): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <span className="dark-week">
      {week.map((kinds, i) => (
        <span key={i} className="dark-week-day">
          {onToggle === undefined ? (
            <span className={kinds === null ? "dark-week-cell" : "dark-week-cell is-on"}>
              {kinds?.map((k, j) => (
                <DayMark key={j} kind={k} filled onDark />
              ))}
            </span>
          ) : (
            <button
              type="button"
              aria-label={weekdayLong(i)}
              aria-pressed={kinds !== null}
              onClick={() => onToggle(i as Weekday)}
              style={dim.includes(i as Weekday) ? { opacity: 0.45 } : undefined}
              className={
                kinds === null ? "dark-week-cell is-button" : "dark-week-cell is-button is-on"
              }
            >
              {kinds?.map((k, j) => (
                <DayMark key={j} kind={k} filled onDark />
              ))}
            </button>
          )}
          <span className="dark-week-letter">{letters[i as Weekday]}</span>
        </span>
      ))}
    </span>
  );
}
