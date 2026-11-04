import React from "react";
import type { LogItem } from "@sendtally/features/journal";
import { EntryRow } from "../journal/EntryRow";
import { ActivityRow } from "./ActivityRow";
import { BlockDoneRow } from "./BlockDoneRow";
import { HangRow } from "./HangRow";
import { openLogItem } from "./openLogItem";

/** One row of the training log, drawn again only when its own data changes. */
export const TrainingLogCell = React.memo(function TrainingLogCell({
  item,
}: {
  item: LogItem;
}): React.ReactElement | null {
  if (item.type === "session") return null;
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
  return <EntryRow entry={item.entry} onPress={() => openLogItem(item)} />;
});
