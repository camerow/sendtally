import React from "react";
import { Link } from "react-router";
import type { ClimbLogRowVM } from "@sendtally/features/climbs";
import type { CircuitColour } from "@sendtally/features/gyms";
import { ClimbPill } from "./ClimbPill";
import { GradeBadge } from "./GradeBadge";

export type ClimbLogRowProps = {
  /** A row with no climb (`id` null) has no page: it reads as text, its name muted. */
  row: Omit<ClimbLogRowVM, "id" | "pill"> & {
    id: string | null;
    pill: ClimbLogRowVM["pill"] | null;
    /** A circuit climb's colour, which fills its grade badge. */
    colour?: CircuitColour | undefined;
  };
  /** Off under a heading that already names the grade. */
  showGrade?: boolean;
  /** Replaces opening the climb; null for a row with nowhere to go. */
  onPress?: (() => void) | null;
  /** Under the row, as a circuit's laps. */
  children?: React.ReactNode;
  /** Set before the grade, such as the day of a climb that stands in the log on its own. */
  leading?: React.ReactNode;
};

/** One climb in the log: its grade, name, crag and when, and how it went. */
export function ClimbLogRow({
  row,
  showGrade = true,
  onPress,
  children,
  leading,
}: ClimbLogRowProps): React.ReactElement {
  const count = (row.count ?? 1) > 1 ? row.count : undefined;
  const label = [
    row.gradeLabel,
    count === undefined ? row.name : `${row.name} ×${count}`,
    row.meta,
    row.pill?.label,
  ]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
  const body = (
    <>
      {leading}
      {showGrade && <GradeBadge label={row.gradeLabel} colour={row.colour} />}
      <span className="climb-row-main">
        <span
          className={row.id === null ? "climb-row-name climb-row-name--plain" : "climb-row-name"}
        >
          {row.name}
          {count !== undefined && <span className="climb-row-count">{` ×${count}`}</span>}
        </span>
        {row.meta !== "" && <span className="climb-row-meta">{row.meta}</span>}
      </span>
      {row.pill !== null && <ClimbPill kind={row.pill.kind} label={row.pill.label} />}
    </>
  );
  const className = children === undefined ? "climb-row climb-row--divided" : "climb-row";
  const line =
    onPress != null ? (
      <button
        type="button"
        className={`${className} climb-row--link`}
        aria-label={label}
        onClick={onPress}
      >
        {body}
      </button>
    ) : onPress === undefined && row.id !== null ? (
      <Link
        to={`/app/log/climbs/${encodeURIComponent(row.id)}`}
        className={`${className} climb-row--link`}
        aria-label={label}
      >
        {body}
      </Link>
    ) : (
      <div className={className} aria-label={label}>
        {body}
      </div>
    );
  if (children === undefined) return line;
  return (
    <div className="climb-row-group">
      {line}
      <div className="climb-row-children">{children}</div>
    </div>
  );
}
