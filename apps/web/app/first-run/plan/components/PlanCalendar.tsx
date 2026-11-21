import React from "react";
import { addDays, type CalendarDate, type Weekday, type WorkoutKind } from "@sendtally/core/hang";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";

export type PlanCalendarProps = {
  /** A Monday. */
  start: CalendarDate;
  weeks: number;
  days: readonly { kind: WorkoutKind; weekdays: readonly Weekday[] }[];
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** The whole block, a row a week, each day dotted with the workouts on it. */
export function PlanCalendar({ start, weeks, days }: PlanCalendarProps): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <div className="plan-path-calendar">
      <span />
      {DAYS.map((d) => (
        <span key={d} className="plan-path-calendar-head">
          {letters[d]}
        </span>
      ))}
      {Array.from({ length: weeks }, (_, w) => (
        <React.Fragment key={w}>
          <span className="plan-path-calendar-week">{t("plan.weekShort", { n: w + 1 })}</span>
          {DAYS.map((d) => {
            const kinds = days.filter((m) => m.weekdays.includes(d)).map((m) => m.kind);
            return (
              <span
                key={d}
                className={
                  kinds.length > 0 ? "plan-path-calendar-day is-on" : "plan-path-calendar-day"
                }
              >
                {Number(addDays(start, w * 7 + d).slice(8))}
                {kinds.length > 0 && (
                  <span className="plan-path-calendar-dots">
                    {kinds.map((k, i) => (
                      <i key={i} style={{ background: KIND_LOOK[k].onDark }} />
                    ))}
                  </span>
                )}
              </span>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
