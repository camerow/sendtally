import React from "react";
import { ScrollView, View } from "react-native";
import { TREND_DISCIPLINES, TREND_RANGES, type TrendsFeature } from "@sendtally/features/trends";
import { Chip } from "../../components/Chip";

export function TrendFilters({ feature }: { feature: TrendsFeature }): React.ReactElement {
  const { state, range, setRange, setDiscipline, tagOptions, selectedTags, toggleTag, clearTags } =
    feature;
  const disciplines = state.status === "ready" ? state.data.disciplines : [];
  const discipline = state.status === "ready" ? state.data.discipline : null;
  return (
    <View style={{ gap: 8 }}>
      {disciplines.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TREND_DISCIPLINES.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              active={discipline === d.value}
              onPress={() => setDiscipline(d.value)}
            />
          ))}
        </View>
      )}
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
