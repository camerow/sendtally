import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import type { TrendStatVM } from "@sendtally/features/trends";
import { card, monoLabel } from "./styles";

export function TrendStats({ stats }: { stats: TrendStatVM[] }): React.ReactElement {
  return (
    <View style={{ ...card, flexDirection: "row", flexWrap: "wrap", overflow: "hidden" }}>
      {stats.map((s) => (
        <View
          key={s.key}
          style={{
            width: "50%",
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 4,
            borderColor: colors.lineOnLightSoft,
            borderRightWidth: 1,
            borderBottomWidth: 1,
          }}
        >
          <Text numberOfLines={1} style={{ ...monoLabel, color: colors.labelAccent }}>
            {s.label}
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 24,
              letterSpacing: -0.4,
              color: colors.gunmetal,
            }}
          >
            {s.value}
          </Text>
          {s.lifetime !== null && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textSecondary }}>
              {s.lifetime}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
