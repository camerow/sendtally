import React from "react";
import { ScrollView, View } from "react-native";
import { disciplineLabel } from "@sendtally/features/log-session";
import {
  PREVIEW_TREND_RANGE,
  TREND_DISCIPLINES,
  TREND_RANGES,
  trendRangeLabel,
  type TrendsFeature,
} from "@sendtally/features/trends";
import { colors } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { FILTER_BAR_HEIGHT, FilterButton } from "../../components/FilterButton";
import { TrendFilterSheet } from "./TrendFilterSheet";

export function TrendFilters({
  feature,
  onLockedRange,
}: {
  feature: TrendsFeature;
  onLockedRange?: () => void;
}): React.ReactElement {
  const {
    state,
    preview,
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
          {TREND_RANGES.map((r) => {
            const locked = preview && r !== PREVIEW_TREND_RANGE;
            return (
              <Chip
                key={r}
                label={trendRangeLabel(r)}
                active={range === r}
                locked={locked}
                onPress={() => (locked ? onLockedRange?.() : setRange(r))}
              />
            );
          })}
          {disciplines.length > 1 &&
            TREND_DISCIPLINES.map((d) => (
              <Chip
                key={d}
                label={disciplineLabel(d)}
                active={discipline === d}
                onPress={() => setDiscipline(d)}
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
