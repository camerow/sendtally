import React from "react";
import { Text, View } from "react-native";
import type { TrendTagRowVM } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";
import { CircuitDot } from "../../components/CircuitDot";

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
          textTransform: "uppercase",
          color: compact ? colors.textMuted : colors.labelAccent,
        }}
      >
        {title}
      </Text>
      {rows.map((row) => (
        <View key={row.key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {row.colour !== undefined && <CircuitDot colour={row.colour} size={compact ? 10 : 12} />}
          <Text
            numberOfLines={1}
            style={{
              width: (compact ? 92 : 96) - (row.colour === undefined ? 0 : compact ? 20 : 22),
              fontFamily: fonts.mono,
              fontSize: compact ? 10 : 11,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: compact ? colors.textSecondary : colors.gunmetal,
            }}
          >
            {row.label}
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
