import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { Label } from "./Label";
import type { Stat } from "./types";

export type StatGridProps = { stats: readonly Stat[]; columns: 2 | 3; valueSize?: number };

/** Label over value: three across between rules, or two across in rows. */
export function StatGrid({ stats, columns, valueSize = 20 }: StatGridProps): React.ReactElement {
  const rows = columns === 2;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        borderTopWidth: 1,
        borderBottomWidth: rows ? 0 : 1,
        borderColor: colors.lineOnLight,
      }}
    >
      {stats.map((s) => (
        <View
          key={s.label}
          accessible
          style={{
            width: `${100 / columns}%`,
            gap: 3,
            paddingVertical: 12,
            paddingRight: 8,
            borderBottomWidth: rows ? 1 : 0,
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
