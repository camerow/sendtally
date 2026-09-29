import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { Label } from "./Label";

export type Stat = { label: string; value: string };

export type StatGridProps = { stats: readonly Stat[]; columns: 2 | 3; valueSize?: number };

/** Label over value on the dark ground: three across between rules, or two across in rows. */
export function StatGrid({ stats, columns, valueSize = 20 }: StatGridProps): React.ReactElement {
  const c = useTheme();
  const rows = columns === 2;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        borderTopWidth: 1,
        borderBottomWidth: rows ? 0 : 1,
        borderColor: c.lineDark,
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
            borderColor: c.lineDark,
          }}
        >
          <Label small color={c.onDark3}>
            {s.label}
          </Label>
          <Text
            style={[type.monoBold, { fontSize: valueSize, color: c.onDark }]}
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
