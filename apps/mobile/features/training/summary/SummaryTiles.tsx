import React from "react";
import { Text, View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import type { Stat } from "../components/types";
import { type } from "../type";

export type SummaryTilesProps = { stats: readonly Stat[] };

/** The headline numbers side by side: value over label. */
export function SummaryTiles({ stats }: SummaryTilesProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {stats.map((s) => (
        <View
          key={s.label}
          accessible
          style={{
            flex: 1,
            gap: 2,
            padding: 10,
            borderRadius: radius.control,
            backgroundColor: colors.surfaceSoft,
          }}
        >
          <Text
            style={[type.display, { fontSize: 22, color: colors.gunmetal }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {s.value}
          </Text>
          <Text style={[type.body, { fontSize: 11.5, color: colors.textSecondary }]}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
