import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { MarkKind } from "@sendtally/features/training";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { kindName } from "./kindLook";

const plannedMark = (
  <View
    style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.gunmetal }}
  />
);

export type StripLegendProps = { kinds: readonly MarkKind[] };

/** What the marks under each day mean. Each cell speaks its own counts, so this stays silent. */
export function StripLegend({ kinds }: StripLegendProps): React.ReactElement {
  const entries = [
    ...kinds.map((kind) => ({
      key: kind,
      mark: <DayMark kind={kind} filled />,
      label: kindName(kind),
    })),
    { key: "planned", mark: plannedMark, label: t("hang.planned") },
  ];
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
