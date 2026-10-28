import React from "react";
import { Pressable, Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { ExerciseTrendVM } from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { metricText } from "../exercises/exerciseText";
import { type } from "../type";

const SPARK = 6;
const SPARK_HEIGHT = 20;

/** "+6 kg": the change since the first time in range, in what the exercise is measured in; nothing when it did not move. */
function changeText(row: ExerciseTrendVM, unit: WeightUnit): string {
  if (row.change === 0 || row.count < 2) return "";
  return `${row.change < 0 ? "−" : "+"}${metricText(Math.abs(row.change), row.metric, unit)}`;
}

/** An exercise: how often, its last few bests as bars, and how much it moved; it opens its trend. */
export function ExerciseTrendRow({
  row,
  unit,
  onPress,
}: {
  row: ExerciseTrendVM;
  unit: WeightUnit;
  onPress?: () => void;
}): React.ReactElement {
  const values = row.values.slice(-SPARK);
  const lo = Math.min(...values);
  const span = Math.max(...values) - lo || 1;
  const change = changeText(row, unit);
  const count = t("statistics.timesCount", { count: row.count });
  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole={onPress === undefined ? undefined : "button"}
      accessibilityLabel={[row.name, count, change].filter(Boolean).join(", ")}
      style={pressRow({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}>
          {row.name}
        </Text>
        <Text numberOfLines={1} style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>
          {row.meta ?? count}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: SPARK_HEIGHT }}>
        {values.map((v, i) => (
          <View
            key={i}
            style={{
              width: 4,
              height: 4 + ((v - lo) / span) * (SPARK_HEIGHT - 4),
              borderRadius: 1,
              backgroundColor: i === values.length - 1 ? colors.fern : colors.lineOnLightStrong,
            }}
          />
        ))}
      </View>
      <Text
        style={[
          type.monoBold,
          {
            width: 74,
            textAlign: "right",
            fontSize: 12,
            color: row.change > 0 ? colors.fern : colors.textMuted,
          },
        ]}
      >
        {change}
      </Text>
      {onPress !== undefined && (
        <Icon name="chevron" color={colors.textMuted} size={16} strokeWidth={2} />
      )}
    </Pressable>
  );
}
