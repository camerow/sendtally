import React from "react";
import { View } from "react-native";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { ClimbLogRow } from "../climbs/ClimbLogRow";
import { EntryRow } from "../journal/EntryRow";
import { TripGroup } from "../journal/TripGroup";
import { ActivityRow } from "./ActivityRow";
import { BlockDoneRow } from "./BlockDoneRow";
import { ClimbingSessionRows } from "./ClimbingSessionRows";
import { HangRow } from "./HangRow";
import { openLogItem } from "./openLogItem";
import type { LogRow } from "./types";

export type LogCellProps = {
  item: LogRow;
  nested: ReadonlyMap<string, ClimbingSessionVM>;
};

/** One row of the Log, drawn again only when its own data changes. */
export const LogCell = React.memo(function LogCell({
  item,
  nested,
}: LogCellProps): React.ReactElement | null {
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
  if (item.type === "hang") {
    return <HangRow hang={item.hang} blockTag={item.blockTag} onPress={() => openLogItem(item)} />;
  }
  if (item.type === "activity") {
    return (
      <ActivityRow
        activity={item.activity}
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
  return <EntryRow entry={item.entry} onPress={() => openLogItem(item)} />;
});
