import React from "react";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { KIND_LOOK, type GridPart, type PlanGridRow } from "@sendtally/features/training";
import { GridCell } from "./GridCell";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type PlanGridProps = {
  rows: readonly PlanGridRow[];
  /** The keys of rows just added, lit for a moment. */
  lit?: readonly string[];
  /** Over the grid, left of the weekdays. */
  title?: string;
  /** Every cell a day to set: off cells read as white boxes. */
  editing?: boolean;
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
 * The week at a glance: a row per plan, a column per weekday, marked where it lands. A row's
 * name opens it; while editing, a cell sets its day.
 */
export function PlanGrid({
  rows,
  lit = [],
  title,
  editing = false,
}: PlanGridProps): React.ReactElement {
  return (
    <div className="plan-grid">
      <div className="plan-grid-row plan-grid-row--head">
        <span className="plan-grid-name plan-label">{title}</span>
        {DAYS.map((i) => (
          <span key={i} className="plan-grid-day plan-label-small plan-label--muted">
            {weekdayLetters()[i]}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          className={lit.includes(row.key) ? "plan-grid-row plan-grid-row--lit" : "plan-grid-row"}
        >
          <button type="button" className="plan-grid-name" onClick={row.open}>
            <span className="plan-row-name">{row.name}</span>
            {row.lines.map((parts, i) => (
              <Line key={i} parts={parts} ink={KIND_LOOK[row.kind].ink} />
            ))}
          </button>
          {DAYS.map((day) => {
            const set = row.toggle?.(day);
            const mark = row.marks?.[day] ?? null;
            const marked = row.marks !== undefined && set === undefined;
            return (
              <GridCell
                key={day}
                kind={row.kind}
                on={marked ? mark !== null : row.days.includes(day)}
                status={marked ? (mark ?? undefined) : undefined}
                asking={set !== undefined && row.days.length === 0}
                editing={editing && set !== undefined}
                label={`${row.name}, ${weekdayLong(day)}`}
                onPress={set ?? row.press?.(day)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
