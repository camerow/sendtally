import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { TrainedKindVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { type } from "../type";
import { KIND_COLORS } from "./kindColors";

export type TrainedMixProps = { trained: TrainedKindVM[]; total: string };

/** What you trained: one stacked bar by sessions, then each kind's sessions and time. */
export function TrainedMix({ trained, total }: TrainedMixProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Label color={colors.gunmetal}>{t("statistics.whatYouTrained")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{total}</Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: "row", height: 14, gap: 2, borderRadius: 7, overflow: "hidden" }}
      >
        {trained.map((k) => (
          <View key={k.kind} style={{ flex: k.share, backgroundColor: KIND_COLORS[k.kind] }} />
        ))}
      </View>
      {trained.map((k) => (
        <View
          key={k.kind}
          accessible
          accessibilityLabel={`${k.name}, ${k.detail}`}
          style={{
            minHeight: 30,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: KIND_COLORS[k.kind],
              }}
            />
            <Text style={[type.body, { fontSize: 14, color: colors.gunmetal }]}>{k.name}</Text>
          </View>
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{k.detail}</Text>
        </View>
      ))}
    </View>
  );
}
