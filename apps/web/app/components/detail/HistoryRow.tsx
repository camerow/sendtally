import React from "react";
import { Link } from "react-router";
import type { HistoryItem } from "@sendtally/features/activities";
import { Icon } from "../Icon";
import { EffortMark } from "./EffortMark";

export type HistoryRowProps = {
  item: HistoryItem;
  /** Where the row opens; none, or a row that is the current page or does not open, is not a link. */
  to?: string;
  /** Titled by its day: no date column, and a chevron where it opens. */
  byDay?: boolean;
};

/** A past session: its date, name and one line of what mattered, with its effort; the one open marked by a blue bar. */
export function HistoryRow({ item, to, byDay = false }: HistoryRowProps): React.ReactElement {
  const opens = to !== undefined && item.current !== true && item.opens !== false;
  const body = (
    <>
      {!byDay && <span className="history-date">{item.date}</span>}
      <span className="history-main">
        <span className="history-name">{item.name}</span>
        {item.meta !== "" && <span className="history-meta">{item.meta}</span>}
        {item.note != null && <span className="history-note">{item.note}</span>}
      </span>
      {item.rpe !== null && <EffortMark rpe={item.rpe} />}
      {byDay && (
        <span className="history-chevron">
          {opens && <Icon name="chevron" size={16} strokeWidth={2} />}
        </span>
      )}
    </>
  );
  const className = item.current === true ? "history-row history-row--current" : "history-row";
  return opens ? (
    <Link to={to} className={`${className} history-row--link`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
