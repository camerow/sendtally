import React from "react";
import { ScrollView, View } from "react-native";
import { TREND_DISCIPLINES, TREND_RANGES, type TrendsFeature } from "@sendtally/features/trends";
import { colors } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { FILTER_BAR_HEIGHT, FilterButton } from "../../components/FilterButton";
import { TrendFilterSheet } from "./TrendFilterSheet";

export function TrendFilters({ feature }: { feature: TrendsFeature }): React.ReactElement {
  const {
    state,
    range,
    setRange,
    setDiscipline,
    tagOptions,
    untaggedCount,
    selectedTags,
    setTags,
  } = feature;
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const disciplines = state.status === "ready" ? state.data.disciplines : [];
  const discipline = state.status === "ready" ? state.data.discipline : null;

  return (
    <>
      <View
        style={{
          height: FILTER_BAR_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: -18,
          borderBottomWidth: 1,
          borderBottomColor: colors.lineOnLightSoft,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: "center", gap: 6, paddingHorizontal: 18 }}
        >
          {TREND_RANGES.map((r) => (
            <Chip
              key={r.value}
              label={r.label}
              active={range === r.value}
              onPress={() => setRange(r.value)}
            />
          ))}
          {disciplines.length > 1 &&
            TREND_DISCIPLINES.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                active={discipline === d.value}
                onPress={() => setDiscipline(d.value)}
              />
            ))}
        </ScrollView>
        {tagOptions.length > 0 && (
          <FilterButton active={selectedTags.length > 0} onPress={() => setFiltersOpen(true)} />
        )}
      </View>
      <TrendFilterSheet
        visible={filtersOpen}
        tagOptions={tagOptions}
        untaggedCount={untaggedCount}
        selectedTags={selectedTags}
        onApply={(tags) => {
          setTags(tags);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
