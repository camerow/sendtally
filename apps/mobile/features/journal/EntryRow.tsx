import React from "react";
import { Pressable, Text, View } from "react-native";
import type { JournalEntry } from "@sendtally/api-client";
import { formatDate } from "@sendtally/features/i18n";
import { entryKindLabel, entryTitle, spanLabel, spansDates } from "@sendtally/features/journal";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { RowDate, rowMeta, rowTitle, SESSION_ROW_HEIGHT } from "../sessions/SessionRow";
import { ROW_TAGS_HEIGHT, RowTags } from "../sessions/RowTags";
import { EntryKindChip } from "./EntryKindChip";

export function entryRowHeight(entry: JournalEntry): number {
  return SESSION_ROW_HEIGHT + (entry.tags.length > 0 ? ROW_TAGS_HEIGHT : 0);
}

/** The session row with one column swapped: the kind chip sits where the grades sit. */
export function EntryRow({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}): React.ReactElement {
  const at = new Date(`${entry.occurred_at}T00:00:00Z`);
  const weekday = formatDate(at, { weekday: "short", timeZone: "UTC" });
  const day = formatDate(at, { day: "numeric", timeZone: "UTC" });
  const title = entryTitle(entry);
  // An untitled entry borrows its first line as a title, so the excerpt would just repeat it.
  const titled = (entry.title?.trim() ?? "") !== "";
  const meta = spansDates(entry.kind)
    ? spanLabel(entry.occurred_at, entry.ends_at)
    : titled
      ? (entry.body.trim().split("\n")[0] ?? "")
      : "";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[entryKindLabel(entry.kind), title, `${weekday} ${day}`].join(", ")}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <RowDate weekday={weekday} day={day} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={rowTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={rowMeta}>
          {meta}
        </Text>
        <RowTags tags={entry.tags} />
      </View>
      <EntryKindChip kind={entry.kind} />
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
