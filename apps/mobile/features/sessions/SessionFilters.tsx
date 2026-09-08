import React from "react";
import { ScrollView, Text, View } from "react-native";
import {
  UNTAGGED_KEY,
  UNTAGGED_LABEL,
  type SessionGrouping,
  type TagOption,
} from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";

export type SessionFiltersProps = {
  grouping: SessionGrouping;
  onGroupingChange: (grouping: SessionGrouping) => void;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  onToggleTag: (slug: string) => void;
  onClearTags: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 9,
  letterSpacing: 0.7,
  color: colors.textMuted,
} as const;

export function SessionFilters({
  grouping,
  onGroupingChange,
  tagOptions,
  untaggedCount,
  selectedTags,
  onToggleTag,
  onClearTags,
}: SessionFiltersProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={label}>GROUP BY</Text>
        {(["month", "tag"] as const).map((value) => (
          <Chip
            key={value}
            label={value.toUpperCase()}
            active={grouping === value}
            onPress={() => onGroupingChange(value)}
          />
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, alignItems: "center" }}
      >
        <Text style={label}>TAGS</Text>
        <Chip label="ALL" active={selectedTags.length === 0} onPress={onClearTags} />
        {tagOptions.map((tag) => (
          <Chip
            key={tag.slug}
            label={`${tag.name.toUpperCase()} ${tag.count}`}
            active={selectedTags.includes(tag.slug)}
            onPress={() => onToggleTag(tag.slug)}
          />
        ))}
        {untaggedCount > 0 && (
          <Chip
            label={`${UNTAGGED_LABEL.toUpperCase()} ${untaggedCount}`}
            active={selectedTags.includes(UNTAGGED_KEY)}
            onPress={() => onToggleTag(UNTAGGED_KEY)}
          />
        )}
      </ScrollView>
    </View>
  );
}
