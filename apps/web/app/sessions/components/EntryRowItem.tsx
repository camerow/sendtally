import React from "react";
import { Link } from "react-router";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate } from "@sendtally/features/i18n";
import {
  displayKind,
  entryKindLabel,
  entryTitle,
  spanLabel,
  spansDates,
} from "@sendtally/features/journal";

/**
 * The same row as a session, one column swapped: the kind chip sits where the
 * grades sit, and the body excerpt where the stats go. Sessions keep the soft
 * fill, entries are white with a hairline.
 */
export function EntryRowItem({
  entry,
  detail,
  heading = false,
}: {
  entry: JournalEntry;
  /** A second line: what a trip holds, or which injury an update is on. */
  detail?: string;
  /** A trip heading the group of what was logged inside its dates. */
  heading?: boolean;
}): React.ReactElement {
  const at = new Date(`${entry.occurred_at}T00:00:00Z`);
  const weekday = formatDate(at, { weekday: "short", timeZone: "UTC" });
  const month = formatDate(at, { month: "short", timeZone: "UTC" });
  const day = formatDate(at, { day: "numeric", timeZone: "UTC" });
  const title = entryTitle(entry);
  const kind = displayKind(entry);
  const meta = spansDates(entry.kind) ? spanLabel(entry.occurred_at, entry.ends_at) : null;
  // An untitled entry borrows its first line as a title, so the excerpt would
  // just repeat it.
  const titled = (entry.title?.trim() ?? "") !== "";
  const excerpt = titled ? entry.body.trim() : "";

  return (
    <Link
      to={`/app/journal/${encodeURIComponent(entry.id)}`}
      className={heading ? "session-row session-row--trip" : "session-row session-row--entry"}
      aria-label={[entryKindLabel(kind), title, `${weekday} ${month} ${day}`].join(", ")}
    >
      <span className="session-row-date">
        <span className="session-row-day">
          <span className="session-row-month">{month} </span>
          {day}
        </span>
        <span className="session-row-weekday">{weekday}</span>
      </span>
      <span className="session-row-main">
        <span className="session-row-title">{title}</span>
        {meta !== null && <span className="session-row-meta">{meta}</span>}
        {detail !== undefined && <span className="session-row-meta">{detail}</span>}
        {entry.tags.length > 0 && (
          <span className="session-row-tags">
            {entry.tags.map((tag) => (
              <span key={tag.id} className="session-row-tag">
                {tag.name}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="session-row-stats session-row-excerpt">{excerpt}</span>
      <span className="session-row-badge">
        <span className={`entry-kind entry-kind--${kind}`}>{entryKindLabel(kind)}</span>
      </span>
      <span className="session-row-chevron">›</span>
    </Link>
  );
}
