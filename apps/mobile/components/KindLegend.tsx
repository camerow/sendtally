import React from "react";
import { Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../features/training/type";

export type KindLegendItem = { key: string; kind: WorkoutKind; name: string };

/** Each workout's name on the dark ground, after a dot in its kind's colour. */
export function KindLegend({ items }: { items: readonly KindLegendItem[] }): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {items.map(({ key, kind, name }) => (
        <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: KIND_LOOK[kind].onDark,
            }}
          />
          <Text style={[type.mono, { fontSize: 12, color: colors.white }]}>{name}</Text>
        </View>
      ))}
    </View>
  );
}
