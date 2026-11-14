import React from "react";
import { Link } from "react-router";
import type { HistoryItem } from "@sendtally/features/activities";
import { EffortMark } from "./EffortMark";

export type HistoryRowProps = {
  item: HistoryItem;
  /** Where the row opens; none, or a row that is the current page or does not open, is not a link. */
  to?: string;
};

/** A past session: its date, name and one line of what mattered, with its effort; the one open marked by a blue bar. */
export function HistoryRow({ item, to }: HistoryRowProps): React.ReactElement {
  const body = (
    <>
      <span className="history-date">{item.date}</span>
      <span className="history-main">
        <span className="history-name">{item.name}</span>
        {item.meta !== "" && <span className="history-meta">{item.meta}</span>}
        {item.note != null && <span className="history-note">{item.note}</span>}
      </span>
      {item.rpe !== null && <EffortMark rpe={item.rpe} />}
    </>
  );
  const opens = to !== undefined && item.current !== true && item.opens !== false;
  const className = item.current === true ? "history-row history-row--current" : "history-row";
  return opens ? (
    <Link to={to} className={`${className} history-row--link`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
