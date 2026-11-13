import React from "react";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { TripGroup } from "../../journal/components/TripGroup";
import { ActivityRow } from "../../sessions/components/ActivityRow";
import { ClimbingSessionRows } from "../../sessions/components/ClimbingSessionRows";
import { EntryRow } from "../../sessions/components/EntryRow";
import { HangRow } from "../../sessions/components/HangRow";
import { ClimbLogRow } from "./ClimbLogRow";
import type { ClimbingLogRow } from "./types";

/** One row of the climbing log. */
export function ClimbingLogCell({
  item,
  nested,
}: {
  item: ClimbingLogRow;
  nested: ReadonlyMap<string, ClimbingSessionVM>;
}): React.ReactElement | null {
  switch (item.type) {
    case "climb":
      return (
        <div className="log-climb log-climb--padded">
          <ClimbLogRow row={item.row} />
        </div>
      );
    case "session":
      return (
        <ClimbingSessionRows
          session={item.session}
          vm={nested.get(item.session.fingerprint)}
          blockTag={item.blockTag}
        />
      );
    case "hang":
      return <HangRow hang={item.hang} blockTag={item.blockTag} />;
    case "activity":
      return <ActivityRow activity={item.activity} blockTag={item.blockTag} />;
    case "block":
      return null;
    case "entry":
      return item.inside.length > 0 ? (
        <TripGroup item={item} climbing={nested} />
      ) : (
        <EntryRow entry={item.entry} />
      );
  }
}
