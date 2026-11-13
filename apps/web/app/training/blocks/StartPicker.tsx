import React from "react";
import { addDays, weekday, type Block, type CalendarDate } from "@sendtally/core/hang";
import { shortDate, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { MonthCalendar } from "../components/MonthCalendar";

export type StartPickerProps = {
  block: Pick<Block, "weeks">;
  start: CalendarDate;
  today: CalendarDate;
  onPick: (date: CalendarDate) => void;
};

/** A month to pick a block's first day on, the rest of its first week shaded, and the range it runs. */
export function StartPicker({ block, start, today, onPick }: StartPickerProps): React.ReactElement {
  const last = addDays(start, block.weeks * 7 - 1);
  return (
    <>
      <MonthCalendar
        selected={start}
        min={today}
        today={today}
        shaded={(d) => d > start && d < addDays(start, 7)}
        onPick={onPick}
      />
      <p className="sheet-body">
        {t("plan.startsRange", {
          start: shortDate(start),
          end: shortDate(last),
          from: weekdayLong(weekday(start)),
          to: weekdayLong(weekday(last)),
        })}
      </p>
    </>
  );
}
