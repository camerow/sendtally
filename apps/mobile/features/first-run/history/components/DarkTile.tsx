import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";

/** A count over its word on the dark card, as Stats' CountTile is on white; dim until it has a value. */
export function DarkTile({
  value,
  label,
  compact = false,
}: {
  value: number | string | null;
  label: string;
  /** Shorter, for a card pinned over a form. */
  compact?: boolean;
}): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${value ?? "–"} ${label}`}
      style={{
        flex: 1,
        minWidth: 0,
        gap: 1,
        paddingVertical: compact ? 6 : 9,
        paddingHorizontal: 8,
        borderRadius: compact ? 10 : 12,
        backgroundColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.displayHeavy,
          fontSize: compact ? 17 : 20,
          lineHeight: compact ? 20 : 24,
          letterSpacing: -0.6,
          color: value === null ? "rgba(255,255,255,0.35)" : colors.white,
        }}
      >
        {value ?? "–"}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.sans,
          fontSize: compact ? 11 : 11.5,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
