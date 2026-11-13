import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { weekDaysRows, type WeekDaysArgs, type WeekDaysRow } from "@sendtally/features/training";
import { GridCell } from "../components/GridCell";

export type WeekDaysGridProps = WeekDaysArgs & { kind: WorkoutKind };

/** A workout's days in its block, a row per week, with Every week on top in Edit mode. */
export function WeekDaysGrid({ kind, ...args }: WeekDaysGridProps): React.ReactElement {
  const { columns, every, weeks } = weekDaysRows(args);
  const row = ({ key, name, sub, bold, cells }: WeekDaysRow): React.ReactElement => (
    <div key={key} className="week-days-row">
      <span className="week-days-name">
        <span className={bold ? "week-days-week is-bold" : "week-days-week"}>{name}</span>
        {sub !== undefined && <span className="week-days-sub">{sub}</span>}
      </span>
      {cells.map(({ day, on, mark, toggle }) => (
        <GridCell
          key={day}
          kind={kind}
          on={on}
          {...(mark !== undefined && { status: mark })}
          {...(toggle !== undefined && { onPress: toggle, editing: true })}
          label={`${name}, ${weekdayLong(day)}`}
        />
      ))}
    </div>
  );
  return (
    <section className="week-days">
      <div className="week-days-row week-days-head">
        <span className="week-days-name plan-label-small">{t("plan.days")}</span>
        {columns.map((day) => (
          <span key={day} className="week-days-letter plan-label-small plan-label--muted">
            {weekdayLetters()[day]}
          </span>
        ))}
      </div>
      {every !== null && <div className="week-days-every">{row(every)}</div>}
      {weeks.map(row)}
    </section>
  );
}
