import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import type { LogPill } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

const pillText = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  lineHeight: 14,
  letterSpacing: 0.66,
  textTransform: "uppercase",
} as const;

/** Each active filter as a gold pill; × drops one, Clear all every one once there are two. */
export function ActiveFilters({
  pills,
  onDrop,
  onClearAll,
}: {
  pills: readonly LogPill[];
  onDrop: (pill: LogPill) => void;
  onClearAll: () => void;
}): React.ReactElement | null {
  if (pills.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 8,
      }}
    >
      {pills.map((pill) => (
        <Pressable
          key={pill.key}
          onPress={() => onDrop(pill)}
          accessibilityRole="button"
          accessibilityLabel={`${pill.label}, ${t("common.clear")}`}
          hitSlop={{ top: 7, bottom: 7 }}
          style={press({
            height: 30,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingLeft: 11,
            paddingRight: 9,
            borderRadius: 15,
            backgroundColor: colors.gold,
          })}
        >
          <Text numberOfLines={1} style={{ ...pillText, color: colors.gunmetal }}>
            {pill.label}
          </Text>
          <Icon name="x" color={colors.gunmetal} size={14} />
        </Pressable>
      ))}
      {pills.length > 1 && (
        <Pressable
          onPress={onClearAll}
          accessibilityRole="button"
          hitSlop={8}
          style={press({ paddingLeft: 4 })}
        >
          <Text style={{ ...pillText, color: colors.azureInk }}>{t("common.clearAll")}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
