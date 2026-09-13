import React from "react";
import { Text, View } from "react-native";
import type { ProjectBar } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";

const HEIGHT = 104;
const VALUE_BAND = 12;

const labelStyle = {
  fontFamily: fonts.monoMedium,
  fontSize: 8,
  lineHeight: 10,
  color: colors.textSecondary,
} as const;

function fill(bar: ProjectBar): string {
  if (bar.sent) return colors.gold;
  return bar.peak ? colors.watermelon : colors.azure;
}

export function ProjectChart({ bars }: { bars: ProjectBar[] }): React.ReactElement {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 4,
          height: HEIGHT + VALUE_BAND,
        }}
      >
        {bars.map((bar, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
            <Text style={labelStyle}>{bar.valueLabel}</Text>
            <View
              style={{
                width: "100%",
                maxWidth: 64,
                height: Math.max(6, Math.round(bar.height * HEIGHT)),
                backgroundColor: fill(bar),
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 4,
          paddingTop: 3,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        {bars.map((bar, i) => (
          <Text key={i} numberOfLines={1} style={[labelStyle, { flex: 1, textAlign: "center" }]}>
            {bar.axisLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}
