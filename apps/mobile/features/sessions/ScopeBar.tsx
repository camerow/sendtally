import React from "react";
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import { TextInput } from "../../components/TextInput";
import { Icon } from "../../components/Icon";
import type { ScopeItem } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { FILTER_BAR_HEIGHT, FilterButton } from "./FilterButton";
import { press } from "../../lib/press";

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
      accessibilityLabel={t("sessions.jumpToLabel", { label: item.label })}
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
          textTransform: "uppercase",
          color: active || strong ? colors.gunmetal : "rgba(64,63,76,0.65)",
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

/** The bar's search: whether the field is open is the bar's own, the text is the filter's. */
export type ScopeSearch = {
  open: boolean;
  text: string;
  onOpen: () => void;
  onChangeText: (text: string) => void;
  onCancel: () => void;
};

export type ScopeBarProps = {
  items: ScopeItem[];
  currentKey: string | null;
  onSelect: (sectionKey: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  search: ScopeSearch;
};

const barFrame = {
  height: FILTER_BAR_HEIGHT,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.white,
  borderBottomWidth: 1,
  borderBottomColor: colors.lineOnLightSoft,
} as const;

function SearchField({ search }: { search: ScopeSearch }): React.ReactElement {
  return (
    <View style={{ ...barFrame, gap: 10, paddingHorizontal: 18 }}>
      <View
        style={{
          flex: 1,
          height: 36,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 10,
          borderRadius: radius.control,
          backgroundColor: colors.surfaceSoft,
        }}
      >
        <Icon name="search" color={colors.textSecondary} size={16} strokeWidth={2} />
        <TextInput
          value={search.text}
          onChangeText={search.onChangeText}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          placeholder={t("sessions.searchLog")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("sessions.searchLog")}
          style={{
            flex: 1,
            height: 36,
            paddingVertical: 0,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
      </View>
      <Pressable onPress={search.onCancel} accessibilityRole="button" hitSlop={8} style={press({})}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: colors.gunmetal }}>
          {t("common.cancel")}
        </Text>
      </Pressable>
    </View>
  );
}

export function ScopeBar({
  items,
  currentKey,
  onSelect,
  filtersActive,
  onOpenFilters,
  search,
}: ScopeBarProps): React.ReactElement {
  const strip = React.useRef<ScrollView>(null);
  const positions = React.useRef(new Map<string, number>());

  React.useEffect(() => {
    if (currentKey === null) return;
    const x = positions.current.get(currentKey);
    if (x !== undefined) strip.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
  }, [currentKey]);

  if (search.open) return <SearchField search={search} />;
  return (
    <View style={barFrame}>
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
      <FilterButton active={filtersActive} onPress={onOpenFilters} onSearch={search.onOpen} />
    </View>
  );
}
