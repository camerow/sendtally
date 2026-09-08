import React from "react";
import { ScrollView, View } from "react-native";
import { TREND_RANGES, type TrendsFeature } from "@sendtally/features/trends";
import { Chip } from "../../components/Chip";

export function TrendFilters({ feature }: { feature: TrendsFeature }): React.ReactElement {
  const { range, setRange, tagOptions, selectedTags, toggleTag, clearTags } = feature;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {TREND_RANGES.map((r) => (
          <Chip
            key={r.value}
            label={r.label}
            active={range === r.value}
            onPress={() => setRange(r.value)}
          />
        ))}
      </View>
      {tagOptions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <Chip label="ALL TAGS" active={selectedTags.length === 0} onPress={clearTags} />
          {tagOptions.map((tag) => (
            <Chip
              key={tag.slug}
              label={tag.name.toUpperCase()}
              active={selectedTags.includes(tag.slug)}
              onPress={() => toggleTag(tag.slug)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
