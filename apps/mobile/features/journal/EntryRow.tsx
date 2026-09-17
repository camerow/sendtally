import React from "react";
import { Pressable, Text, View } from "react-native";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate } from "@sendtally/features/i18n";
import {
  displayKind,
  entryKindLabel,
  entryTitle,
  spanLabel,
  spansDates,
} from "@sendtally/features/journal";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { rowMeta, rowTitle, SESSION_ROW_HEIGHT } from "../sessions/SessionRow";
import { DayColumn } from "../sessions/SessionRowParts";
import { ROW_TAGS_HEIGHT, RowTags } from "../sessions/RowTags";
import { EntryKindChip } from "./EntryKindChip";

export const TRIP_TINT = "rgba(204,121,234,0.13)";

/** A trip heading its group carries what it holds on a second meta line. */
export const HEADING_DETAIL_HEIGHT = 17;

export function entryRowHeight(entry: JournalEntry): number {
  return SESSION_ROW_HEIGHT + (entry.tags.length > 0 ? ROW_TAGS_HEIGHT : 0);
}

/** The session row with one column swapped: the kind chip sits where the grades sit. */
export function EntryRow({
  entry,
  onPress,
  detail,
  heading = false,
  inset = false,
}: {
  entry: JournalEntry;
  onPress: () => void;
  /** Said after the dates: what a trip holds, or which injury an update is on. */
  detail?: string;
  /** A trip heading the group of what was logged inside its dates. */
  heading?: boolean;
  /** Inside a group that already sets the row in from the screen edge. */
  inset?: boolean;
}): React.ReactElement {
  const at = new Date(`${entry.occurred_at}T00:00:00Z`);
  const weekday = formatDate(at, { weekday: "short", timeZone: "UTC" });
  const day = formatDate(at, { day: "numeric", timeZone: "UTC" });
  const title = entryTitle(entry);
  // An untitled entry borrows its first line as a title, so the excerpt would just repeat it.
  const titled = (entry.title?.trim() ?? "") !== "";
  const meta = spansDates(entry.kind)
    ? spanLabel(entry.occurred_at, entry.ends_at)
    : titled && detail === undefined
      ? (entry.body.trim().split("\n")[0] ?? "")
      : (detail ?? "");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[entryKindLabel(displayKind(entry)), title, `${weekday} ${day}`].join(
        ", "
      )}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: heading ? 8 : inset ? 0 : 18,
        borderBottomWidth: 1,
        borderBottomColor: heading ? "transparent" : colors.lineOnLightSoft,
        borderRadius: heading ? 11 : 0,
        backgroundColor: heading ? TRIP_TINT : undefined,
      })}
    >
      <DayColumn weekday={weekday} day={day} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={rowTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={rowMeta}>
          {meta}
        </Text>
        {heading && detail !== undefined && (
          <Text
            numberOfLines={1}
            style={{ ...rowMeta, fontFamily: fonts.monoSemiBold, color: colors.petalInk }}
          >
            {detail}
          </Text>
        )}
        <RowTags tags={entry.tags} />
      </View>
      <EntryKindChip kind={displayKind(entry)} />
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
