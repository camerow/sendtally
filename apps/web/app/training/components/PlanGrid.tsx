import React from "react";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { KIND_LOOK, type GridPart, type PlanGridRow } from "@sendtally/features/training";
import { PlanGridCell } from "./PlanGridCell";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type PlanGridProps = {
  rows: readonly PlanGridRow[];
  /** Off inside a card that already draws the frame. */
  framed?: boolean;
  /** The keys of rows just added, lit for a moment. */
  lit?: readonly string[];
  /** Over the grid, left of the weekdays. */
  title?: string;
  /** A dated week's day numbers by weekday, Monday first, under the weekday letters. */
  dates?: readonly string[];
  /** The weekdays left to right: Monday first unless a dated week starts on another. */
  columns?: readonly number[];
  /** In place of the title, on its own row over the weekdays, such as a block's week arrows. */
  head?: React.ReactNode;
  /** Every cell a day to set: off cells read as white boxes. */
  editing?: boolean;
  /** Under the rows, inside the frame, such as which weeks an edit reaches. */
  footer?: React.ReactNode;
};

function Line({ parts, ink }: { parts: readonly GridPart[]; ink: string }): React.ReactElement {
  return (
    <span className="plan-grid-line" style={{ color: ink }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && " · "}
          <span className={p.changed === true ? "plan-grid-changed" : undefined}>{p.text}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * The week at a glance: a row per plan, a column per weekday, marked where it lands. Click a
 * row to open it; on a block being built, click a cell to set its day.
 */
export function PlanGrid({
  rows,
  framed = true,
  lit = [],
  title,
  dates,
  columns = DAYS,
  head,
  editing = false,
  footer,
}: PlanGridProps): React.ReactElement {
  return (
    <div className={framed ? "plan-grid plan-grid--framed" : "plan-grid"}>
      {head}
      <div className="plan-grid-row plan-grid-days">
        <span className="plan-grid-name">
          {title !== undefined && <span className="plan-label">{title}</span>}
        </span>
        {columns.map((i) => (
          <span key={i} className="plan-grid-day">
            <span className="plan-label-small plan-label--muted">{weekdayLetters()[i]}</span>
            {dates !== undefined && <span className="plan-grid-date">{dates[i]}</span>}
          </span>
        ))}
      </div>
      {rows.map((row) => {
        const { toggle } = row;
        const cells = columns.map((day) => {
          const set = toggle?.(day);
          const press = set ?? row.press?.(day);
          const mark = row.marks?.[day] ?? null;
          const marked = row.marks !== undefined && set === undefined;
          return (
            <PlanGridCell
              key={day}
              kind={row.kind}
              on={marked ? mark !== null : row.days.includes(day)}
              {...(marked && mark !== null && { status: mark })}
              asking={set !== undefined && row.days.length === 0}
              {...(press !== undefined && { onPress: press })}
              opens={set === undefined}
              editing={editing && set !== undefined}
              label={`${row.name}, ${weekdayLong(day)}`}
            />
          );
        });
        return (
          <div
            key={row.key}
            className={lit.includes(row.key) ? "plan-grid-row plan-grid-row--lit" : "plan-grid-row"}
          >
            <button type="button" className="plan-grid-name plan-grid-open" onClick={row.open}>
              <span className="plan-grid-workout">{row.name}</span>
              {row.lines.map((parts, i) => (
                <Line key={i} parts={parts} ink={KIND_LOOK[row.kind].ink} />
              ))}
            </button>
            {cells}
          </div>
        );
      })}
      {footer}
    </div>
  );
}
