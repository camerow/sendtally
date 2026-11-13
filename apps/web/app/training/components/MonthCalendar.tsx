import React from "react";
import {
  addDays,
  addMonths,
  monthStart,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";
import { dayTitle, monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { bandOn, monthWeeks } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";

export type MonthCalendarProps = {
  /** The date it opens on, marked as picked unless `picked` lists several. */
  selected: CalendarDate;
  picked?: readonly CalendarDate[];
  min: CalendarDate | null;
  max?: CalendarDate | undefined;
  today: CalendarDate;
  /** Blocks to band across the weeks they cover, as the plan calendar shows them. */
  blocks?: readonly Block[];
  /** Days tinted as a run, such as the rest of a block's first week. */
  shaded?: (d: CalendarDate) => boolean;
  onPick: (d: CalendarDate) => void;
};

/** An inline month grid, Monday first, opening on the selected date's month. */
export function MonthCalendar({
  selected,
  picked,
  min,
  max,
  today,
  blocks,
  shaded,
  onPick,
}: MonthCalendarProps): React.ReactElement {
  const [month, setMonth] = React.useState(() => monthStart(selected));
  const inMonth = (d: CalendarDate): boolean => d.slice(0, 7) === month.slice(0, 7);
  const bandLabel = (monday: CalendarDate): string | null => {
    const band = blocks === undefined ? null : bandOn(blocks, monday);
    return band === null
      ? null
      : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks });
  };
  return (
    <div className="month-calendar">
      <div className="month-calendar-head">
        <button
          type="button"
          className="month-calendar-step"
          aria-label={t("hang.previousMonth")}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <Icon name="back" size={18} strokeWidth={2} />
        </button>
        <span className="month-calendar-title">{monthTitle(month)}</span>
        <button
          type="button"
          className="month-calendar-step"
          aria-label={t("hang.nextMonth")}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <Icon name="forward" size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="month-calendar-row">
        {weekdayLetters().map((letter, i) => (
          <span key={i} className="month-calendar-letter">
            {letter}
          </span>
        ))}
      </div>
      {monthWeeks(month).map((monday) => {
        const band = bandLabel(monday);
        return (
          <div key={monday}>
            {blocks !== undefined && (
              <span className={band === null ? "block-band" : "block-band block-band--on"}>
                {band}
              </span>
            )}
            <div className="month-calendar-row">
              {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => {
                if (!inMonth(d)) return <span key={d} className="month-calendar-day" />;
                const off = (min !== null && d < min) || (max !== undefined && d > max);
                const on = picked === undefined ? d === selected : picked.includes(d);
                const inBlock = !off && shaded?.(d) === true;
                const tone = on
                  ? " is-on"
                  : inBlock
                    ? " is-shaded"
                    : d === today
                      ? " is-today"
                      : "";
                return (
                  <button
                    key={d}
                    type="button"
                    className={`month-calendar-day${tone}`}
                    disabled={off}
                    aria-pressed={on}
                    aria-label={inBlock ? t("hang.inBlock", { date: dayTitle(d) }) : dayTitle(d)}
                    onClick={() => onPick(d)}
                  >
                    <span>{Number(d.slice(8))}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
