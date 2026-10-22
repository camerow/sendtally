import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { BlockWeek } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { type } from "../type";

const TALLEST = 64;

const height = (value: number, top: number): number =>
  top === 0 ? 0 : Math.max(value > 0 ? 3 : 0, Math.round((value / top) * TALLEST));

export type BlockEffortProps = { weeks: readonly BlockWeek[] };

/** Per week, a bar for the effort logged in it. */
export function BlockEffort({ weeks }: BlockEffortProps): React.ReactElement {
  const top = Math.max(1, ...weeks.map((w) => w.actual));
  return (
    <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={colors.gunmetal}>{t("plan.effort")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.effortLogged")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
        {weeks.map((w) => (
          <View
            key={w.week}
            accessible
            accessibilityLabel={t("plan.effortLoggedWeek", {
              n: w.week,
              actual: w.ahead ? "–" : formatNumber(w.actual),
            })}
            style={{ flex: 1, alignItems: "center", gap: 4 }}
          >
            <View style={{ alignSelf: "stretch", justifyContent: "flex-end", height: TALLEST }}>
              <View
                style={{
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
              {t("plan.weekShort", { n: w.week })}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[type.body, { fontSize: 12, lineHeight: 17, color: colors.textSecondary }]}>
        {t("plan.effortLoggedHint")}
      </Text>
    </View>
  );
}
