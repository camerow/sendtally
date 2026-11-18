import React from "react";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { TripGroup } from "../../journal/components/TripGroup";
import { ClimbLogRow } from "../../climbs/components/ClimbLogRow";
import { ActivityRow } from "./ActivityRow";
import { BlockDoneRow } from "./BlockDoneRow";
import { ClimbingSessionRows } from "./ClimbingSessionRows";
import { EntryRow } from "./EntryRow";
import { HangRow } from "./HangRow";
import type { LogRow } from "./types";

export function LogCell({
  item,
  nested,
}: {
  item: LogRow;
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
      return <BlockDoneRow recap={item.recap} />;
    case "entry":
      return item.inside.length > 0 ? (
        <TripGroup item={item} climbing={nested} />
      ) : (
        <EntryRow entry={item.entry} />
      );
  }
}
