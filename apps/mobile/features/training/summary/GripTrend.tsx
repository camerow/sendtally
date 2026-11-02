import React from "react";
import { Text, View } from "react-native";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { type } from "../type";

const LOW = 10;
const HIGH = 70;

export type GripTrendProps = {
  /** Every session on the grip, oldest first. */
  sessions: readonly Pick<HangSession, "id" | "loadKg" | "protocol">[];
  currentId: string;
  unit: WeightUnit;
};

/** The added weight on this grip, session by session, this one in gold. */
export function GripTrend({
  sessions,
  currentId,
  unit,
}: GripTrendProps): React.ReactElement | null {
  const [first] = sessions;
  if (first === undefined || sessions.length < 2) return null;
  const loads = sessions.map((s) => s.loadKg);
  const [lo, hi] = [Math.min(...loads), Math.max(...loads)];
  const height = (kg: number): number => LOW + ((kg - lo) / (hi - lo || 1)) * (HIGH - LOW);
  const label = (kg: number): string => loadLabel(first.protocol.kind, kg, unit);
  return (
    <View
      style={{
        gap: 8,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={colors.gunmetal}>{t("summary.addedWeight")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("hang.sessionCount", { count: sessions.length })}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t("statistics.exerciseChart", {
          exercise: t("summary.addedWeight"),
          from: label(first.loadKg),
          to: label(loads.at(-1) ?? first.loadKg),
        })}
        style={{ height: HIGH, flexDirection: "row", alignItems: "flex-end", gap: 6 }}
      >
        {sessions.map((s) => (
          <View
            key={s.id}
            style={{
              flex: 1,
              height: height(s.loadKg),
              borderRadius: 3,
              backgroundColor: s.id === currentId ? colors.gold : "rgba(64,63,76,0.3)",
            }}
          />
        ))}
      </View>
    </View>
  );
}
