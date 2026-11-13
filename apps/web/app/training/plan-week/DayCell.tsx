import React from "react";
import { weekday } from "@sendtally/core/hang";
import { dayTitle, weekdayShort } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { dayMarks, type DayMarkSpec, type TrainingDay } from "@sendtally/features/training";
import { DayMark } from "./DayMark";

const oncePerKind = (marks: readonly DayMarkSpec[]): DayMarkSpec[] =>
  [...new Set(marks.map((m) => m.kind))].map((kind) => ({
    kind,
    filled: marks.some((m) => m.kind === kind && m.filled),
  }));

/** One day of the strip: its name, its date and a mark per kind trained or planned. */
export function DayCell({
  day,
  selected,
  onPress,
}: {
  day: TrainingDay;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  const marks = dayMarks(day);
  const tone = selected ? "selected" : day.isToday ? "today" : "plain";
  return (
    <button
      type="button"
      className={`day-cell day-cell--${tone}`}
      aria-pressed={selected}
      aria-label={t("training.dayAria", {
        day: dayTitle(day.date),
        logged: marks.filter((m) => m.filled).length,
        planned: marks.filter((m) => !m.filled).length,
      })}
      onClick={onPress}
    >
      <span className="day-cell-name">
        {day.isToday ? t("training.today") : weekdayShort(weekday(day.date))}
      </span>
      <span className="day-cell-date">{Number(day.date.slice(8))}</span>
      <span className="day-cell-marks">
        {oncePerKind(marks).map((m, i) => (
          <DayMark key={i} kind={m.kind} filled={m.filled} onDark={selected} />
        ))}
      </span>
    </button>
  );
}
