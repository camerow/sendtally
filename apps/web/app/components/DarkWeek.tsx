import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { weekdayLetters } from "@sendtally/features/hang";
import { DayMark } from "../training/plan-week/DayMark";

/** Seven days on the dark ground, Monday first: lit where training lands, with each workout's mark. */
export function DarkWeek({
  week,
}: {
  week: readonly (readonly WorkoutKind[] | null)[];
}): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <span className="dark-week">
      {week.map((kinds, i) => (
        <span key={i} className="dark-week-day">
          <span className={kinds === null ? "dark-week-cell" : "dark-week-cell is-on"}>
            {kinds?.map((k, j) => (
              <DayMark key={j} kind={k} filled onDark />
            ))}
          </span>
          <span className="dark-week-letter">{letters[i as Weekday]}</span>
        </span>
      ))}
    </span>
  );
}
