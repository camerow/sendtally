import React from "react";
import { Link } from "react-router";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import {
  entryKindLabel,
  entryTitle,
  spanLabel,
  tripMeta,
  type LogItem,
} from "@sendtally/features/journal";
import { useDisplayScales } from "@sendtally/features/settings";
import { Icon } from "../../components/Icon";
import { ActivityRow } from "../../sessions/components/ActivityRow";
import { ClimbingSessionRows } from "../../sessions/components/ClimbingSessionRows";
import { EntryKindChip } from "../../sessions/components/EntryKindChip";
import { EntryRow } from "../../sessions/components/EntryRow";
import { HangRow } from "../../sessions/components/HangRow";
import { RowTags } from "../../sessions/components/RowTags";
import { TripEffort } from "./TripEffort";

type TripItem = Extract<LogItem, { type: "entry" }>;

/** A trip and everything logged inside its dates, held by the rail down its side. */
export function TripGroup({
  item,
  climbing,
}: {
  item: TripItem;
  /** Each session's climbs, set in under it. */
  climbing?: ReadonlyMap<string, ClimbingSessionVM>;
}): React.ReactElement {
  const scales = useDisplayScales();
  const last = item.inside.length - 1;
  const span = spanLabel(item.entry.occurred_at, item.entry.ends_at);
  const meta = tripMeta(item.inside, scales);
  return (
    <div className="trip-group">
      <Link
        to={`/app/journal/${encodeURIComponent(item.entry.id)}`}
        className="trip-head"
        aria-label={[entryKindLabel("trip"), entryTitle(item.entry), span, meta].join(", ")}
      >
        <span className="trip-head-main">
          <span className="trip-head-kicker">
            <EntryKindChip kind="trip" onTint />
            <span className="trip-head-span">{span}</span>
          </span>
          <span className="trip-head-title">{entryTitle(item.entry)}</span>
          <span className="log-row-meta">{meta}</span>
          <RowTags tags={item.entry.tags} />
        </span>
        <TripEffort trip={item.entry} inside={item.inside} />
        <span className="log-row-chevron">
          <Icon name="chevron" size={12} strokeWidth={2} />
        </span>
      </Link>
      <div className="trip-rows">
        {item.inside.map((inner, n) =>
          inner.type === "session" ? (
            <ClimbingSessionRows
              key={inner.key}
              session={inner.session}
              vm={climbing?.get(inner.session.fingerprint)}
              inset
              divider={n < last}
              blockTag={inner.blockTag}
            />
          ) : inner.type === "hang" ? (
            <HangRow
              key={inner.key}
              hang={inner.hang}
              inset
              divider={n < last}
              blockTag={inner.blockTag}
            />
          ) : inner.type === "activity" ? (
            <ActivityRow
              key={inner.key}
              activity={inner.activity}
              inset
              divider={n < last}
              blockTag={inner.blockTag}
            />
          ) : inner.type === "block" ? null : (
            <EntryRow key={inner.key} entry={inner.entry} inset divider={n < last} />
          )
        )}
      </div>
    </div>
  );
}
