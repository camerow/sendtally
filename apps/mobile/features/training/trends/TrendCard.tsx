import React from "react";
import { Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import type { HangKind, TrendSummary, WeightUnit } from "@sendtally/core/hang";
import { bestIndex, dayMonth, loadLabel } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { type } from "../type";
import { EffortLine } from "./EffortLine";
import { Legend } from "./Legend";
import { LoadChart } from "./LoadChart";
import { changeOf } from "./trendText";

export type TrendCardProps = {
  /** What the chart is read out as. */
  name: string;
  /** Top right: the setup the series ran on. */
  caption: string;
  series: readonly HangSessionRecord[];
  summary: TrendSummary;
  kind: HangKind;
  unit: WeightUnit;
};

/**
 * Completed load over a series: the latest and its change, partials as rings, the best in gold.
 * Before any session is complete it leads with the latest attempt, drawn as a ring.
 */
export function TrendCard({
  name,
  caption,
  series,
  summary,
  kind,
  unit,
}: TrendCardProps): React.ReactElement {
  const change = changeOf(summary, unit);
  const load = (kg: number): string => loadLabel(kind, kg, unit);
  const first = series[0];
  const attempting = summary.best === null;
  const headline = attempting
    ? t("hang.latestAttempt")
    : kind === "hang"
      ? t("hang.addedLoadCompleted")
      : t("hang.weightCompleted");
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={colors.gunmetal}>{headline}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{caption}</Text>
      </View>
      <View
        style={{ flexDirection: "row", alignItems: attempting ? "center" : "baseline", gap: 10 }}
      >
        {attempting && (
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 3,
              borderColor: colors.gunmetal,
            }}
          />
        )}
        <Title size={40}>{load(summary.last ?? summary.latest)}</Title>
        {summary.completed > 1 && change !== 0 && (
          <Label
            color={colors.gunmetal}
            style={{
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor: colors.surfaceSoft,
            }}
          >
            {t("hang.delta", {
              arrow: change > 0 ? "▲" : "▼",
              value: formatNumber(Math.abs(change)),
              unit,
            })}
          </Label>
        )}
      </View>
      <LoadChart
        series={series}
        kind={kind}
        unit={unit}
        marked={bestIndex(series, summary)}
        label={t("hang.chartAria", {
          workout: name,
          from: load(summary.first ?? first?.loadKg ?? summary.latest),
          to: load(summary.last ?? summary.latest),
        })}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label small color={colors.textSecondary}>
          {first === undefined ? "" : dayMonth(first.date)}
        </Label>
        <Label small color={colors.textSecondary}>
          {t("hang.allSessionsLatest", { count: series.length })}
        </Label>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        <Legend ring={false} label={t("hang.legendCompleted")} />
        <Legend ring label={t("hang.legendPartial")} />
      </View>
      <EffortLine rpes={series.map((s) => s.rpe)} />
    </View>
  );
}
