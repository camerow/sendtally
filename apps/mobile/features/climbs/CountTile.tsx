import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

export type CountTileProps = { value: number | string; label: string };

/** A number or grade over a word: one of the four tiles on Stats > Climbing. */
export function CountTile({ value, label }: CountTileProps): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{
        flex: 1,
        gap: 2,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 14,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: 22,
          lineHeight: 26,
          letterSpacing: -0.6,
          color: colors.gunmetal,
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.textSecondary }}
      >
        {label}
      </Text>
    </View>
  );
}
