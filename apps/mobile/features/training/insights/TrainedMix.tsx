import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  mixRows,
  type TrainedBy,
  type TrainedFocusVM,
  type TrainedKindVM,
} from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { type } from "../type";

export type TrainedMixProps = {
  trained: TrainedKindVM[];
  byFocus: TrainedFocusVM[];
  total: string;
  by: TrainedBy;
  onBy: (by: TrainedBy) => void;
  /** The legend row picked to narrow the workouts, by its key. */
  picked: string | null;
  onPick: (key: string | null) => void;
};

/** What you trained, by category or by focus: one stacked bar by sessions, then each one's sessions and time; a row picks itself as a filter. */
export function TrainedMix({
  trained,
  byFocus,
  total,
  by,
  onBy,
  picked,
  onPick,
}: TrainedMixProps): React.ReactElement {
  const rows = mixRows({ trained, byFocus }, by);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Label color={colors.gunmetal}>{t("statistics.whatYouTrained")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{total}</Text>
      </View>
      <Segmented<TrainedBy>
        value={by}
        onChange={onBy}
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
          <View
            key={r.key}
            style={{
              flex: r.share,
              backgroundColor: r.color,
              opacity: picked === null || picked === r.key ? 1 : 0.25,
            }}
          />
        ))}
      </View>
      <>
        {rows.map((r) => {
          const on = picked === r.key;
          return (
            <Pressable
              key={r.key}
              onPress={() => onPick(on ? null : r.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${r.name}, ${r.detail}`}
              style={pressRow({
                minHeight: 30,
                marginHorizontal: -8,
                paddingHorizontal: 8,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: on ? colors.surfaceSoft : undefined,
                opacity: picked === null || on ? 1 : 0.45,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: r.color }}
                />
                <Text
                  style={[on ? type.bodyBold : type.body, { fontSize: 14, color: colors.gunmetal }]}
                >
                  {r.name}
                </Text>
                {on && <Icon name="check" color={colors.gunmetal} size={14} />}
              </View>
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {r.detail}
              </Text>
            </Pressable>
          );
        })}
      </>
    </View>
  );
}
