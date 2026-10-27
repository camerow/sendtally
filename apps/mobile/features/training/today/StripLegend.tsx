import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { type } from "../type";
import { DayMark } from "./DayMark";

export type StripLegendProps = { kinds: readonly WorkoutKind[] };

/** What the marks under each day mean. Each cell speaks its own counts, so this stays silent. */
export function StripLegend({ kinds }: StripLegendProps): React.ReactElement {
  const entries = kinds.map((kind) => ({
    key: kind,
    mark: <DayMark kind={kind} filled />,
    label: kindLabel(kind),
  }));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: 14,
        rowGap: 6,
        paddingHorizontal: 6,
      }}
    >
      {entries.map((e) => (
        <View key={e.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {e.mark}
          <Text style={[type.body, { fontSize: 12, color: colors.textSecondary }]}>{e.label}</Text>
        </View>
      ))}
    </View>
  );
}
