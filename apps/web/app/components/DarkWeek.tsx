import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { DayMark } from "../training/plan-week/DayMark";

/** Seven days on the dark ground, Monday first: lit where training lands, with each workout's mark. With `onToggle`, each day is the button that turns it on and off. */
export function DarkWeek({
  week,
  onToggle,
}: {
  week: readonly (readonly WorkoutKind[] | null)[];
  onToggle?: (day: Weekday) => void;
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
