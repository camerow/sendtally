import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { weekTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { TrainingDay } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { DayCell } from "./DayCell";

export type WeekStripProps = {
  offset: number;
  days: readonly TrainingDay[];
  selected: CalendarDate;
  onSelect: (date: CalendarDate) => void;
  onOffset: (offset: number) => void;
};

/** The week's seven days with what each holds, and the way to the week before and after. */
export function WeekStrip({
  offset,
  days,
  selected,
  onSelect,
  onOffset,
}: WeekStripProps): React.ReactElement {
  return (
    <div className="week-strip">
      <div className="week-strip-head">
        <span className="plan-label">{weekTitle(offset)}</span>
        <button
          type="button"
          className="week-strip-step"
          aria-label={t("hang.previousWeek")}
          onClick={() => onOffset(offset - 1)}
        >
          <Icon name="back" size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="week-strip-step"
          aria-label={t("hang.nextWeek")}
          onClick={() => onOffset(offset + 1)}
        >
          <Icon name="forward" size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="week-strip-days">
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            selected={day.date === selected}
            onPress={() => onSelect(day.date)}
          />
        ))}
      </div>
    </div>
  );
}
