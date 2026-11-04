import React from "react";
import { View } from "react-native";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { EntryRow } from "../journal/EntryRow";
import { TripGroup } from "../journal/TripGroup";
import { BlockDoneRow } from "../sessions/BlockDoneRow";
import { ClimbingSessionRows } from "../sessions/ClimbingSessionRows";
import { openLogItem } from "../sessions/openLogItem";
import { ClimbLogRow } from "./ClimbLogRow";
import type { ClimbingLogRow } from "./types";

export type ClimbingLogCellProps = {
  item: ClimbingLogRow;
  nested: ReadonlyMap<string, ClimbingSessionVM>;
};

/** One row of the climbing log, drawn again only when its own data changes. */
export const ClimbingLogCell = React.memo(function ClimbingLogCell({
  item,
  nested,
}: ClimbingLogCellProps): React.ReactElement | null {
  if (item.type === "climb") {
    return (
      <View style={{ paddingHorizontal: 18 }}>
        <ClimbLogRow row={item.row} />
      </View>
    );
  }
  if (item.type === "session") {
    return (
      <ClimbingSessionRows
        session={item.session}
        vm={nested.get(item.session.fingerprint)}
        blockTag={item.blockTag}
        onPress={() => openLogItem(item)}
      />
    );
  }
  if (item.type === "block") {
    return <BlockDoneRow recap={item.recap} onPress={() => openLogItem(item)} />;
  }
  if (item.type === "entry" && item.inside.length > 0) {
    return <TripGroup item={item} onOpen={openLogItem} climbing={nested} />;
  }
  if (item.type === "entry") {
    return <EntryRow entry={item.entry} onPress={() => openLogItem(item)} />;
  }
  return null;
});
