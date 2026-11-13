import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK, type CellMark } from "@sendtally/features/training";
import { DayMark } from "../plan-week/DayMark";

export type PlanGridCellProps = {
  kind: WorkoutKind;
  on: boolean;
  /**
   * On a dated day: done fills the mark, planned outlines it, missed greys it, skipped is
   * slashed, moved away is outlined with an arrow, and moved in carries an azure dot.
   */
  status?: CellMark;
  /** A plan with no days yet: outlined in its kind's colour, asking for one. */
  asking?: boolean;
  /** Makes the cell a button: a weekday to toggle, or with `opens` a day to open. */
  onPress?: () => void;
  opens?: boolean;
  /** A day to set: drawn as a field, white when off, tinted with the kind's line when on. */
  editing?: boolean;
  label: string;
};

/** One weekday of a plan's week: its kind's mark where it lands, a dot where it does not. */
export function PlanGridCell({
  kind,
  on,
  status,
  asking = false,
  onPress,
  opens = false,
  editing = false,
  label,
}: PlanGridCellProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const moved = status === "moved";
  const style: React.CSSProperties = {
    background:
      moved || (editing && !on)
        ? "var(--bs-white)"
        : on && status !== "skipped"
          ? look.tint
          : "var(--surface-soft)",
    border:
      asking || moved || editing
        ? `${asking ? 1.5 : 1}px solid ${moved || (editing && !on) ? "var(--line-on-light-strong)" : look.ink}`
        : "none",
  };
  const mark =
    status === "skipped" ? (
      <span className="grid-cell-slash" />
    ) : moved ? (
      <span className="grid-cell-arrow">→</span>
    ) : on ? (
      <>
        <DayMark
          kind={kind}
          filled={status === undefined || status === "done"}
          missed={status === "missed"}
        />
        {status === "movedIn" && <span className="grid-cell-moved-in" />}
      </>
    ) : (
      <span className="grid-cell-dot" />
    );
  const className = editing ? "grid-cell grid-cell--field" : "grid-cell";
  if (onPress === undefined)
    return (
      <span className={className} style={style} role="img" aria-label={label}>
        {mark}
      </span>
    );
  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      {...(!opens && { role: "checkbox", "aria-checked": on })}
      onClick={onPress}
    >
      {mark}
    </button>
  );
}
