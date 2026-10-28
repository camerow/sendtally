import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

/** A word over a value: one of a climb's three tiles. */
export function LabelTile({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      style={{
        flex: 1,
        gap: 2,
        padding: 12,
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
          fontSize: 26,
          lineHeight: 30,
          letterSpacing: -0.8,
          color: colors.gunmetal,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
