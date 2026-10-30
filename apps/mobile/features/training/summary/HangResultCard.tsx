import React from "react";
import { Text, View } from "react-native";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { hangGrid } from "@sendtally/features/activities";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { loadChange } from "./summaryText";

type Hang = Pick<HangSession, "protocol" | "pct" | "loadKg" | "edgeMm">;

export type HangResultCardProps = {
  session: Hang;
  previous: Pick<HangSession, "loadKg"> | undefined;
  gripName: string;
  unit: WeightUnit;
};

/** A hangboard session's hangs, set by set: held dark, let go hollow. */
export function HangResultCard({
  session,
  previous,
  gripName,
  unit,
}: HangResultCardProps): React.ReactElement {
  const { protocol } = session;
  const grid = hangGrid(session);
  const letGo = grid.total - grid.held;
  const name =
    protocol.kind === "hang"
      ? `${gripName} · ${t("hang.edgeMm", { n: session.edgeMm })}`
      : gripName;
  const meta = [
    loadLabel(protocol.kind, session.loadKg, unit),
    t("summary.setsOf", { count: protocol.sets, reps: String(protocol.reps) }),
    ...(letGo > 0 ? [t("summary.letGo", { count: letGo })] : []),
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
      <View
        accessible
        accessibilityLabel={t("summary.hangsOf", { held: grid.held, total: grid.total })}
        style={{ gap: 4 }}
      >
        {grid.rows.map((row, s) => (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[type.mono, { width: 52, fontSize: 11.5, color: colors.textSecondary }]}>
              {t("summary.setN", { n: s + 1 })}
            </Text>
            {row.map((held, r) => (
              <View
                key={r}
                style={{
                  flex: 1,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: held ? colors.gunmetal : undefined,
                  borderWidth: held ? 0 : 2,
                  borderColor: "rgba(64,63,76,0.35)",
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>{meta}</Text>
    </View>
  );
}
