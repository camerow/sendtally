import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { ExerciseTrendVM } from "@sendtally/features/statistics";
import { metricText } from "../exercises/exerciseText";
import { type } from "../type";

const SPARK = 6;
const SPARK_HEIGHT = 20;

/** "+6 kg": the change since the first time in range, in what the exercise is measured in. */
function changeText(row: ExerciseTrendVM, unit: WeightUnit): string {
  return `${row.change < 0 ? "−" : "+"}${metricText(Math.abs(row.change), row.metric, unit)}`;
}

/** An exercise: how often, its last few bests as bars, and how much it moved. */
export function ExerciseTrendRow({
  row,
  unit,
}: {
  row: ExerciseTrendVM;
  unit: WeightUnit;
}): React.ReactElement {
  const values = row.values.slice(-SPARK);
  const lo = Math.min(...values);
  const span = Math.max(...values) - lo || 1;
  const change = changeText(row, unit);
  const count = t("statistics.timesCount", { count: row.count });
  return (
    <View
      accessible
      accessibilityLabel={`${row.name}, ${count}, ${change}`}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}>
          {row.name}
        </Text>
        <Text style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>{count}</Text>
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
        style={[type.monoBold, { width: 74, textAlign: "right", fontSize: 12, color: colors.fern }]}
      >
        {change}
      </Text>
    </View>
  );
}
