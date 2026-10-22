import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { OverviewKindVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { type } from "../type";
import { KIND_COLORS } from "./kindColors";

/** Where the time went: one bar split by kind, each part labelled with its time. */
export function TimeSplit({
  kinds,
}: {
  kinds: readonly OverviewKindVM[];
}): React.ReactElement | null {
  const spent = kinds.filter((k) => k.minutes > 0);
  if (spent.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Label color={colors.gunmetal}>{t("statistics.whereTimeWent")}</Label>
      <View
        style={{ flexDirection: "row", height: 14, gap: 2, borderRadius: 7, overflow: "hidden" }}
      >
        {spent.map((k) => (
          <View key={k.kind} style={{ flex: k.minutes, backgroundColor: KIND_COLORS[k.kind] }} />
        ))}
      </View>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}
      >
        {spent.map((k) => (
          <Text key={k.kind} style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {`${k.name} · ${k.time}`}
          </Text>
        ))}
      </View>
    </View>
  );
}
