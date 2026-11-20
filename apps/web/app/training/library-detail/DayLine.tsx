import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";

export type DayLineProps = { week: number | null; date: CalendarDate; missed: boolean };

/** A planned run's week and day under its title: "Week 2 · Thu, Nov 5", the day amber once missed. */
export function DayLine({ week, date, missed }: DayLineProps): React.ReactElement {
  const day = shortDate(date);
  return (
    <span className="day-line">
      {week !== null && `${t("plan.weekNumber", { n: week })} · `}
      {missed ? <span className="day-line-missed">{t("plan.missedOn", { day })}</span> : day}
    </span>
  );
}
