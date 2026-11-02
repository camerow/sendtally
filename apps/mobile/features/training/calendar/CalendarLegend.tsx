import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { DayMark } from "../today/DayMark";
import { type } from "../type";

/** What a mark's fill says; its shape and colour say the kind. */
export function CalendarLegend(): React.ReactElement {
  const entries = [
    { key: "done", mark: <DayMark kind="hangboard" filled />, label: t("plan.done") },
    { key: "planned", mark: <DayMark kind="hangboard" filled={false} />, label: t("hang.planned") },
    {
      key: "missed",
      mark: <DayMark kind="hangboard" filled={false} missed />,
      label: t("hang.missed"),
    },
    {
      key: "today",
      mark: (
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gunmetal }} />
      ),
      label: t("training.today"),
    },
  ];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 }}
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
