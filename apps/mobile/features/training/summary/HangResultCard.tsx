import React from "react";
import { Text, View } from "react-native";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { hangGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { HangGrid } from "./HangGrid";
import { Label } from "../components/Label";
import { hangCount } from "./hangCount";

type Hang = Pick<HangSession, "protocol" | "pct" | "loadKg" | "edgeMm" | "done">;

export type HangResultCardProps = {
  session: Hang;
  gripName: string;
  unit: WeightUnit;
};

/** A hangboard session's hangs and load, set by set, and how many hangs it held. */
export function HangResultCard({
  session,
  gripName,
  unit,
}: HangResultCardProps): React.ReactElement {
  const grid = hangGrid(session);
  const name =
    session.protocol.kind === "hang"
      ? `${gripName} · ${t("hang.edgeMm", { n: session.edgeMm })}`
      : gripName;
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
      <HangGrid rows={grid.rows} loads={grid.loads} unit={unit} />
      <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
        {hangCount(grid, unit)}
      </Text>
    </View>
  );
}
