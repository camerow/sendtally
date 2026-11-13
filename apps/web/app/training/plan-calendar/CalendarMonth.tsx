import React from "react";
import { addMonths, type CalendarDate } from "@sendtally/core/hang";
import { dayTitle, monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  bandOn,
  monthWeeks,
  trainingWeek,
  useTrainingLog,
  type TrainingDay,
} from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { DayMark } from "../plan-week/DayMark";

function CalendarDay({
  day,
  inMonth,
  selected,
  onPick,
}: {
  day: TrainingDay;
  inMonth: boolean;
  selected: boolean;
  onPick: () => void;
}): React.ReactElement {
  const plans = day.plans.filter(
    (o) => o.workout !== undefined && o.status !== "moved" && o.status !== "skipped"
  );
  const tone = day.isToday ? " is-today" : day.isPast ? " is-past" : "";
  return (
    <button
      type="button"
      className={`calendar-day${inMonth ? "" : " is-out"}${selected ? " is-selected" : ""}`}
      aria-label={t("calendar.dayAria", { day: dayTitle(day.date), n: plans.length })}
      onClick={onPick}
    >
      <span className={`calendar-day-number${tone}`}>{Number(day.date.slice(8))}</span>
      <span className="calendar-day-marks">
        {plans.map((o) =>
          o.workout === undefined ? null : (
            <DayMark
              key={o.membership.id}
              kind={o.workout.kind}
              filled={o.status === "done"}
              missed={o.status === "missed"}
            />
          )
        )}
      </span>
    </button>
  );
}

/** The plan a month at a time: blocks as bands, a mark per planned workout; a day picks it. */
export function CalendarMonth({
  selected,
  onPick,
  month,
  onMonth,
}: {
  selected?: CalendarDate;
  onPick: (date: CalendarDate) => void;
  month: CalendarDate;
  onMonth: (month: CalendarDate) => void;
}): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const bandOf = (monday: CalendarDate): string | null => {
    const band = bandOn(log.plan.blocks, monday);
    return band === null
      ? null
      : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks });
  };
  return (
    <div className="calendar-month">
      <div className="calendar-month-head">
        <button
          type="button"
          className="month-calendar-step"
          aria-label={t("hang.previousMonth")}
          onClick={() => onMonth(addMonths(month, -1))}
        >
          <Icon name="back" size={20} strokeWidth={2} />
        </button>
        <h2 className="calendar-month-title">{monthTitle(month)}</h2>
        <button
          type="button"
          className="month-calendar-step"
          aria-label={t("hang.nextMonth")}
          onClick={() => onMonth(addMonths(month, 1))}
        >
          <Icon name="forward" size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="calendar-letters">
        {weekdayLetters().map((letter, i) => (
          <span key={i} className="plan-label-small plan-label--muted">
            {letter}
          </span>
        ))}
      </div>
      {monthWeeks(month).map((monday) => {
        const band = bandOf(monday);
        return (
          <div key={monday}>
            <span className={band === null ? "block-band" : "block-band block-band--on"}>
              {band}
            </span>
            <div className="calendar-week">
              {trainingWeek(log, monday, today).map((day) => (
                <CalendarDay
                  key={day.date}
                  day={day}
                  inMonth={day.date.slice(0, 7) === month.slice(0, 7)}
                  selected={day.date === selected}
                  onPick={() => onPick(day.date)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
