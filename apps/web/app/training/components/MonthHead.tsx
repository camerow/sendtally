import React from "react";
import { addMonths, type CalendarDate } from "@sendtally/core/hang";
import { monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/**
 * A month grid's head: the month's title between steps to the month before and after, then the
 * weekday letters. Large on the plan calendar, where the title heads the page.
 */
export function MonthHead({
  month,
  onMonth,
  large = false,
}: {
  month: CalendarDate;
  onMonth: (month: CalendarDate) => void;
  large?: boolean;
}): React.ReactElement {
  const step = (by: 1 | -1): React.ReactElement => (
    <button
      type="button"
      className="month-calendar-step"
      aria-label={by < 0 ? t("hang.previousMonth") : t("hang.nextMonth")}
      onClick={() => onMonth(addMonths(month, by))}
    >
      <Icon name={by < 0 ? "back" : "forward"} size={large ? 20 : 18} strokeWidth={2} />
    </button>
  );
  return (
    <>
      <div className={large ? "calendar-month-head" : "month-calendar-head"}>
        {step(-1)}
        {large ? (
          <h2 className="calendar-month-title">{monthTitle(month)}</h2>
        ) : (
          <span className="month-calendar-title">{monthTitle(month)}</span>
        )}
        {step(1)}
      </div>
      <div className={large ? "calendar-letters" : "month-calendar-row"}>
        {weekdayLetters().map((letter, i) => (
          <span
            key={i}
            className={large ? "plan-label-small plan-label--muted" : "month-calendar-letter"}
          >
            {letter}
          </span>
        ))}
      </div>
    </>
  );
}
