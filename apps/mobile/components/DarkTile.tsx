import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

/** A count over its word on the dark card, as Stats' CountTile is on white; dim until it has a value. */
export function DarkTile({
  value,
  label,
}: {
  value: number | string | null;
  label: string;
}): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${value ?? "–"} ${label}`}
      style={{
        flex: 1,
        minWidth: 0,
        gap: 1,
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: 20,
          lineHeight: 24,
          letterSpacing: -0.6,
          color: value === null ? "rgba(255,255,255,0.35)" : colors.white,
        }}
      >
        {value ?? "–"}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.sans, fontSize: 11.5, color: "rgba(255,255,255,0.72)" }}
      >
        {label}
      </Text>
    </View>
  );
}
