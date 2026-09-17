import React from "react";
import { View } from "react-native";
import type { LogItem } from "@sendtally/features/journal";
import { logCountLabel, sessionTitle } from "@sendtally/features/sessions";
import { SessionRow, sessionRowHeight } from "../sessions/SessionRow";
import { EntryRow, entryRowHeight, HEADING_DETAIL_HEIGHT } from "./EntryRow";

type TripItem = Extract<LogItem, { type: "entry" }>;

const GROUP_MARGIN = 8;

const innerHeight = (item: LogItem): number =>
  item.type === "session" ? sessionRowHeight(item.session) : entryRowHeight(item.entry);

export function tripGroupHeight(item: TripItem): number {
  return (
    GROUP_MARGIN * 2 +
    entryRowHeight(item.entry) +
    HEADING_DETAIL_HEIGHT +
    item.inside.reduce((sum, inner) => sum + innerHeight(inner), 0)
  );
}

/** A trip and everything logged inside its dates; the rule down its side is the grouping. */
export function TripGroup({
  item,
  onOpen,
}: {
  item: TripItem;
  onOpen: (item: LogItem) => void;
}): React.ReactElement {
  return (
    <View
      style={{
        marginVertical: GROUP_MARGIN,
        marginHorizontal: 18,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: "rgba(204,121,234,0.7)",
      }}
    >
      <EntryRow
        entry={item.entry}
        detail={logCountLabel(item.inside)}
        heading
        onPress={() => onOpen(item)}
      />
      {item.inside.map((inner) =>
        inner.type === "session" ? (
          <SessionRow
            key={inner.key}
            session={inner.session}
            title={sessionTitle(inner.session)}
            inset
            onPress={() => onOpen(inner)}
          />
        ) : (
          <EntryRow key={inner.key} entry={inner.entry} inset onPress={() => onOpen(inner)} />
        )
      )}
    </View>
  );
}
