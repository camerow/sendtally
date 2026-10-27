import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export type StatTileProps = { label: string; value: string; detail: string };

export function StatTile({ label, value, detail }: StatTileProps): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}, ${detail}`}
      style={{
        flex: 1,
        gap: 2,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: 30,
          lineHeight: 36,
          letterSpacing: -0.9,
          color: colors.gunmetal,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
        {detail}
      </Text>
    </View>
  );
}
