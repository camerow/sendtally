import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { MonthSummaryVM } from "@sendtally/features/statistics";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

const SPARK_HEIGHT = 28;

/** This month in one line, and the way into Statistics. */
export function LogSummary({ vm }: { vm: MonthSummaryVM }): React.ReactElement {
  const most = Math.max(1, ...vm.weeks);
  const last = vm.weeks.length - 1;
  return (
    <Pressable
      onPress={() => router.push("/statistics")}
      accessibilityRole="button"
      style={press({
        marginHorizontal: 18,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: colors.surfaceSoft,
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {vm.month}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}>
          {vm.line}
        </Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: SPARK_HEIGHT }}
      >
        {vm.weeks.map((n, i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: Math.max(2, (n / most) * SPARK_HEIGHT),
              borderRadius: 2,
              backgroundColor: i === last ? colors.gunmetal : "rgba(64,63,76,0.3)",
            }}
          />
        ))}
      </View>
      <Icon name="chevron" size={18} strokeWidth={2} color={colors.gunmetal} />
    </Pressable>
  );
}
