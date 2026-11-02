import React from "react";
import { Text, View } from "react-native";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { hangGrid } from "@sendtally/features/activities";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { HangGrid } from "./HangGrid";
import { loadChange } from "./summaryText";

type Hang = Pick<HangSession, "protocol" | "pct" | "loadKg" | "edgeMm">;

export type HangResultCardProps = {
  session: Hang;
  previous: Pick<HangSession, "loadKg"> | undefined;
  gripName: string;
  unit: WeightUnit;
};

/** A hangboard session's hangs, set by set, and how many of them it held. */
export function HangResultCard({
  session,
  previous,
  gripName,
  unit,
}: HangResultCardProps): React.ReactElement {
  const { protocol } = session;
  const grid = hangGrid(session);
  const name =
    protocol.kind === "hang"
      ? `${gripName} · ${t("hang.edgeMm", { n: session.edgeMm })}`
      : gripName;
  const meta = [
    loadLabel(protocol.kind, session.loadKg, unit),
    t("summary.hangsOf", { held: grid.held, total: grid.total }),
  ].join(" · ");
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 15.5, color: colors.gunmetal }]}>
          {name}
        </Text>
        {previous !== undefined && (
          <Text style={[type.monoBold, { fontSize: 11.5, color: colors.fern }]}>
            {t("summary.vsLast", { change: loadChange(session.loadKg - previous.loadKg, unit) })}
          </Text>
        )}
      </View>
      <HangGrid rows={grid.rows} />
      <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>{meta}</Text>
    </View>
  );
}
