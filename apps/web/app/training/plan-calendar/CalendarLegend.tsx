import React from "react";
import { t } from "@sendtally/features/i18n";
import { DayMark } from "../plan-week/DayMark";

/** What a mark's fill says; its shape and colour say the kind. */
export function CalendarLegend(): React.ReactElement {
  return (
    <div className="calendar-legend" aria-hidden="true">
      <span>
        <DayMark kind="hangboard" filled />
        {t("plan.done")}
      </span>
      <span>
        <DayMark kind="hangboard" filled={false} />
        {t("hang.planned")}
      </span>
      <span>
        <DayMark kind="hangboard" filled={false} missed />
        {t("hang.missed")}
      </span>
      <span>
        <span className="calendar-legend-today" />
        {t("training.today")}
      </span>
    </div>
  );
}
