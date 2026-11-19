import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { Label } from "./Label";
import type { Stat } from "@sendtally/features/activities";

export type StatGridProps = { stats: readonly Stat[]; valueSize?: number };

/** Label over value, three across, each row over a rule. */
export function StatGrid({ stats, valueSize = 20 }: StatGridProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        borderTopWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      {stats.map((s) => (
        <View
          key={s.label}
          accessible
          accessibilityLabel={`${s.label} ${s.value}`}
          style={{
            width: "33.33%",
            gap: 3,
            paddingVertical: 12,
            paddingRight: 8,
            borderBottomWidth: 1,
            borderColor: colors.lineOnLight,
          }}
        >
          <Label small color={colors.textSecondary}>
            {s.label}
          </Label>
          <Text
            style={[type.monoBold, { fontSize: valueSize, color: colors.gunmetal }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {s.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
