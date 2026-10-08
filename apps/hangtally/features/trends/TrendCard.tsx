import React from "react";
import { Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import type { HangKind, TrendSummary, WeightUnit } from "@sendtally/core/hang";
import { loadLabel, shortDate } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { EffortLine } from "./EffortLine";
import { Legend } from "./Legend";
import { LoadChart } from "./LoadChart";
import { changeOf } from "./trendText";

export type TrendCardProps = {
  workout: string;
  series: readonly HangSessionRecord[];
  summary: TrendSummary;
  kind: HangKind;
  unit: WeightUnit;
};

export function TrendCard({
  workout,
  series,
  summary,
  kind,
  unit,
}: TrendCardProps): React.ReactElement {
  const c = useTheme();
  const change = changeOf(summary, unit);
  const load = (kg: number): string => loadLabel(kind, kg, unit);
  const first = series[0];
  return (
    <View
      style={{
        gap: 12,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderRadius: 20,
        backgroundColor: c.card,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Label color={c.ink2}>
            {kind === "hang" ? t("hang.addedLoadCompleted") : t("hang.weightCompleted")}
          </Label>
          <Title size={44} color={c.ink}>
            {load(summary.last)}
          </Title>
        </View>
        <Text
          style={[
            type.monoBold,
            {
              fontSize: 14,
              color: c.ink,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: change >= 0 ? c.accentSoft : c.restSoft,
            },
          ]}
        >
          {t("hang.delta", {
            arrow: change >= 0 ? "▲" : "▼",
            value: formatNumber(Math.abs(change)),
            unit,
          })}
        </Text>
      </View>
      <LoadChart
        series={series}
        kind={kind}
        unit={unit}
        label={t("hang.chartAria", { workout, from: load(summary.first), to: load(summary.last) })}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
        <Label small color={c.ink2}>
          {first === undefined ? "" : shortDate(first.date)}
        </Label>
        <Label small color={c.ink2}>
          {t("hang.allSessionsLatest", { count: series.length })}
        </Label>
      </View>
      <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 4 }}>
        <Legend ring={false} label={t("hang.legendCompleted")} />
        <Legend ring label={t("hang.legendPartial")} />
      </View>
      <EffortLine rpes={series.map((s) => s.rpe)} />
    </View>
  );
}
