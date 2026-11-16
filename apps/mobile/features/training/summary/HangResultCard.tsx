import React from "react";
import { Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import type { HangGripGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { HangGrid } from "./HangGrid";
import { Label } from "../components/Label";
import { hangCount } from "@sendtally/features/activities";

export type HangResultCardProps = {
  grid: HangGripGrid;
  gripName: string;
  unit: WeightUnit;
};

/** One grip of a hangboard session: its hangs, load and RPE set by set, and how many hangs it held. */
export function HangResultCard({ grid, gripName, unit }: HangResultCardProps): React.ReactElement {
  const name =
    grid.kind === "hang" ? `${gripName} · ${t("hang.edgeMm", { n: grid.edgeMm })}` : gripName;
  return (
    <View
      style={{
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 15.5, color: colors.gunmetal }]}>
          {name}
        </Text>
        <Label small color={colors.textSecondary}>
          {t("summary.load")}
        </Label>
      </View>
      <HangGrid rows={grid.rows} loads={grid.loads} rpes={grid.rpes} unit={unit} />
      <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
        {hangCount(grid, unit)}
      </Text>
    </View>
  );
}
