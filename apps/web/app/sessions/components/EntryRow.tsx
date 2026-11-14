import React from "react";
import { Link } from "react-router";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate } from "@sendtally/features/i18n";
import { displayKind, entryKindLabel, entryRowMeta, entryTitle } from "@sendtally/features/journal";
import { Icon } from "../../components/Icon";
import { DayColumn } from "./DayColumn";
import { EntryKindChip } from "./EntryKindChip";
import { RowTags } from "./RowTags";
import { rowClass } from "./rowClass";

/** The session row with one column swapped: the kind chip sits where the grades sit. */
export function EntryRow({
  entry,
  detail,
  inset = false,
  divider = true,
}: {
  entry: JournalEntry;
  /** Said after the dates: what a trip holds, or which injury an update is on. */
  detail?: string;
  inset?: boolean;
  divider?: boolean;
}): React.ReactElement {
  const at = new Date(`${entry.occurred_at}T00:00:00Z`);
  const weekday = formatDate(at, { weekday: "short", timeZone: "UTC" });
  const day = formatDate(at, { day: "numeric", timeZone: "UTC" });
  const title = entryTitle(entry);
  const kind = displayKind(entry);
  return (
    <Link
      to={`/app/journal/${encodeURIComponent(entry.id)}`}
      aria-label={[entryKindLabel(kind), title, `${weekday} ${day}`].join(", ")}
      className={rowClass(inset, divider, true)}
    >
      <DayColumn weekday={weekday} day={day} />
      <span className="log-row-main">
        <span className="log-row-title">
          <span className="log-row-title-text">{title}</span>
        </span>
        <span className="log-row-meta">{entryRowMeta(entry, detail)}</span>
        <RowTags tags={entry.tags} />
      </span>
      <EntryKindChip kind={kind} />
      <span className="log-row-chevron">
        <Icon name="chevron" size={12} strokeWidth={2} />
      </span>
    </Link>
  );
}
