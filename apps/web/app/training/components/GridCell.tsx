import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK, type CellMark } from "@sendtally/features/training";
import { DayMark } from "../plan-week/DayMark";

export type GridCellProps = {
  kind: WorkoutKind;
  on: boolean;
  /** On a dated day: done fills the mark, planned outlines it, missed greys it, skipped is slashed. */
  status?: CellMark;
  /** A plan with no days yet: outlined in its kind's colour, asking for one. */
  asking?: boolean;
  /** A day to set: drawn as a field, white when off. */
  editing?: boolean;
  label: string;
  onPress?: () => void;
};

/** One weekday of a plan's week: its kind's mark where it lands, a dot where it does not. */
export function GridCell({
  kind,
  on,
  status,
  asking = false,
  editing = false,
  label,
  onPress,
}: GridCellProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const lit = on && status !== "skipped" && status !== "moved" && !(editing && !on);
  const style: React.CSSProperties = {
    background: lit ? look.tint : editing || status === "moved" ? "var(--bs-white)" : undefined,
    borderColor: asking || (editing && on) ? look.ink : undefined,
  };
  const className = [
    "grid-cell",
    editing ? "grid-cell--editing" : "",
    asking ? "grid-cell--asking" : "",
  ].join(" ");
  const mark =
    status === "skipped" ? (
      <span className="grid-cell-slash" />
    ) : status === "moved" ? (
      <span className="grid-cell-moved">→</span>
    ) : on ? (
      <DayMark
        kind={kind}
        filled={status === undefined || status === "done"}
        missed={status === "missed"}
      />
    ) : (
      <span className="grid-cell-dot" />
    );
  return onPress === undefined ? (
    <span className={className} style={style} role="img" aria-label={label}>
      {mark}
    </span>
  ) : (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      aria-pressed={editing ? on : undefined}
      onClick={onPress}
    >
      {mark}
    </button>
  );
}
