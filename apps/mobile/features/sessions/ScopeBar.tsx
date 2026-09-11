import React from "react";
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import type { ScopeItem } from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { FILTER_BAR_HEIGHT, FilterButton } from "../../components/FilterButton";
import { press } from "../../lib/press";

export const SCOPE_BAR_HEIGHT = FILTER_BAR_HEIGHT;

function ScopeChip({
  item,
  active,
  onPress,
  onLayout,
}: {
  item: ScopeItem;
  active: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}): React.ReactElement {
  const strong = item.kind === "year";
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`Jump to ${item.label}`}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 7, bottom: 7 }}
      style={press({
        height: 30,
        justifyContent: "center",
        paddingHorizontal: 11,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: active ? colors.gold : strong ? colors.gunmetal : colors.lineOnLightStrong,
        backgroundColor: active ? colors.gold : "transparent",
      })}
    >
      <Text
        style={{
          fontFamily: strong ? fonts.monoSemiBold : fonts.monoMedium,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.66,
          color: active || strong ? colors.gunmetal : "rgba(64,63,76,0.65)",
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export type ScopeBarProps = {
  items: ScopeItem[];
  currentKey: string | null;
  onSelect: (sectionKey: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
};

export function ScopeBar({
  items,
  currentKey,
  onSelect,
  filtersActive,
  onOpenFilters,
}: ScopeBarProps): React.ReactElement {
  const strip = React.useRef<ScrollView>(null);
  const positions = React.useRef(new Map<string, number>());

  React.useEffect(() => {
    if (currentKey === null) return;
    const x = positions.current.get(currentKey);
    if (x !== undefined) strip.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
  }, [currentKey]);

  return (
    <View
      style={{
        height: SCOPE_BAR_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <ScrollView
        ref={strip}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center", gap: 6, paddingHorizontal: 18 }}
      >
        {items.map((item) => (
          <ScopeChip
            key={item.key}
            item={item}
            active={item.sectionKey === currentKey && item.kind !== "year"}
            onPress={() => onSelect(item.sectionKey)}
            onLayout={(event) => positions.current.set(item.sectionKey, event.nativeEvent.layout.x)}
          />
        ))}
      </ScrollView>
      <FilterButton active={filtersActive} onPress={onOpenFilters} />
    </View>
  );
}
