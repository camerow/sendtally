import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { MAX_WEEK_LOAD } from "@sendtally/core/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { BlockWeek } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { type } from "../type";
import { phaseLabel } from "./blockText";

const TALLEST = 64;

const height = (value: number, top: number): number =>
  top === 0 ? 0 : Math.max(value > 0 ? 3 : 0, Math.round((value / top) * TALLEST));

function effortLabel(w: BlockWeek): string {
  const label = t("plan.effortWeek", {
    n: w.week,
    load: w.load,
    planned: formatNumber(w.planned),
    actual: w.ahead ? "–" : formatNumber(w.actual),
  });
  return w.phase === null ? label : t("plan.withPhase", { label, phase: phaseLabel(w.phase) });
}

export type BlockEffortProps = { weeks: readonly BlockWeek[] };

/**
 * Per week, a dashed bar for planned effort beside a filled one for what was logged, in
 * front of a band for the week's planned load.
 */
export function BlockEffort({ weeks }: BlockEffortProps): React.ReactElement {
  const top = Math.max(1, ...weeks.flatMap((w) => [w.planned, w.actual]));
  return (
    <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={colors.gunmetal}>{t("plan.effort")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.plannedActual")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
        {weeks.map((w) => (
          <View
            key={w.week}
            accessible
            accessibilityLabel={effortLabel(w)}
            style={{ flex: 1, alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                alignSelf: "stretch",
                flexDirection: "row",
                gap: 3,
                alignItems: "flex-end",
                height: TALLEST,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: -3,
                  right: -3,
                  bottom: 0,
                  height: Math.round((w.load / MAX_WEEK_LOAD) * TALLEST),
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  backgroundColor: colors.white,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: height(w.planned, top),
                  borderRadius: 4,
                  borderWidth: w.planned > 0 ? 1.5 : 0,
                  borderStyle: "dashed",
                  borderColor: colors.gunmetal,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: w.ahead ? 0 : height(w.actual, top),
                  borderRadius: 4,
                  backgroundColor: colors.azure,
                }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}
            >
              {w.phase === null ? t("plan.weekShort", { n: w.week }) : phaseLabel(w.phase)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[type.body, { fontSize: 12, lineHeight: 17, color: colors.textSecondary }]}>
        {t("plan.effortHint")}
      </Text>
    </View>
  );
}
