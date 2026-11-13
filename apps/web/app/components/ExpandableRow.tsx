import React from "react";
import { Icon } from "./Icon";

export type ExpandableRowProps = {
  expanded: boolean;
  onToggle: () => void;
  /** What the row reads as to a screen reader. */
  label: string;
  /** What the row shows, left of its chevron. */
  children: React.ReactNode;
  /** What opens under it, lined up with the row's text. */
  body: React.ReactNode;
  indent: number;
};

/** A list row that opens in place: a soft fill and the chevron turned down while open. */
export function ExpandableRow({
  expanded,
  onToggle,
  label,
  children,
  body,
  indent,
}: ExpandableRowProps): React.ReactElement {
  return (
    <>
      <button
        type="button"
        className={expanded ? "expandable-row expandable-row--open" : "expandable-row"}
        aria-expanded={expanded}
        aria-label={label}
        onClick={onToggle}
      >
        {children}
        <span className="expandable-row-chevron">
          <Icon name="chevron" size={14} strokeWidth={2} />
        </span>
      </button>
      {expanded && (
        <div className="expandable-row-body" style={{ paddingLeft: indent }}>
          {body}
        </div>
      )}
    </>
  );
}
