import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { TrainedFocusVM, TrainedKindVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { type } from "../type";
import { focusColor } from "./focusColors";
import { KIND_COLORS } from "./kindColors";

export type TrainedBy = "category" | "focus";

export type TrainedMixProps = {
  trained: TrainedKindVM[];
  byFocus: TrainedFocusVM[];
  total: string;
};

/** What you trained, by category or by focus: one stacked bar by sessions, then each one's sessions and time. */
export function TrainedMix({ trained, byFocus, total }: TrainedMixProps): React.ReactElement {
  const [by, setBy] = React.useState<TrainedBy>("category");
  const rows =
    by === "category"
      ? trained.map((k) => ({ ...k, key: k.kind, color: KIND_COLORS[k.kind] }))
      : byFocus.map((f) => ({ ...f, key: f.focus ?? "general", color: focusColor(f.focus) }));
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Label color={colors.gunmetal}>{t("statistics.whatYouTrained")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{total}</Text>
      </View>
      <Segmented<TrainedBy>
        value={by}
        onChange={setBy}
        height={36}
        options={[
          { value: "category", label: t("workouts.category") },
          { value: "focus", label: t("focus.label") },
        ]}
      />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: "row", height: 14, gap: 2, borderRadius: 7, overflow: "hidden" }}
      >
        {rows.map((r) => (
          <View key={r.key} style={{ flex: r.share, backgroundColor: r.color }} />
        ))}
      </View>
      {rows.map((r) => (
        <View
          key={r.key}
          accessible
          accessibilityLabel={`${r.name}, ${r.detail}`}
          style={{
            minHeight: 30,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: r.color }} />
            <Text style={[type.body, { fontSize: 14, color: colors.gunmetal }]}>{r.name}</Text>
          </View>
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{r.detail}</Text>
        </View>
      ))}
    </View>
  );
}
