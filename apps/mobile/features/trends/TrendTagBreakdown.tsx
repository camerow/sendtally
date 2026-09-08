import React from "react";
import { Text, View } from "react-native";
import type { TrendTagRowVM } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";

export type TrendTagBreakdownProps = {
  title: string;
  rows: TrendTagRowVM[];
  compact?: boolean;
};

export function TrendTagBreakdown({
  title,
  rows,
  compact = false,
}: TrendTagBreakdownProps): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <View style={{ gap: compact ? 6 : 10 }}>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: compact ? 9 : 10,
          letterSpacing: 0.7,
          color: compact ? colors.textMuted : colors.watermelonInk,
        }}
      >
        {title}
      </Text>
      {rows.map((row) => (
        <View key={row.key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            numberOfLines={1}
            style={{
              width: compact ? 92 : 96,
              fontFamily: fonts.mono,
              fontSize: compact ? 10 : 11,
              letterSpacing: 0.5,
              color: compact ? colors.textSecondary : colors.gunmetal,
            }}
          >
            {row.label.toUpperCase()}
          </Text>
          <View
            style={{
              flex: 1,
              height: compact ? 8 : 12,
              borderRadius: 3,
              backgroundColor: colors.dataBarEmpty,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.max(row.ratio * 100, 2)}%`,
                backgroundColor: colors.azure,
                borderRadius: 3,
              }}
            />
          </View>
          <Text
            style={{
              width: compact ? 40 : 48,
              textAlign: "right",
              fontFamily: fonts.monoSemiBold,
              fontSize: compact ? 11 : 12,
              color: colors.gunmetal,
            }}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
