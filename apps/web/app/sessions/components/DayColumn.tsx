import React from "react";

/** A log row's date: the day of the month over its weekday. */
export function DayColumn({
  weekday,
  day,
}: {
  weekday: string;
  day: string | number;
}): React.ReactElement {
  return (
    <span className="day-column">
      <span className="day-column-day">{day}</span>
      <span className="day-column-weekday">{weekday}</span>
    </span>
  );
}
