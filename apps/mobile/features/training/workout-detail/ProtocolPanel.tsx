import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { timeOnEdge, totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { PhaseBar } from "../components/PhaseBar";
import { StatGrid } from "../components/StatGrid";
import { type } from "../type";
import { Swatch } from "./Swatch";

/** The phase bar with its legend, the summary line, and the headline numbers. */
export function ProtocolPanel({ workout }: { workout: Workout }): React.ReactElement {
  const hang = workout.kind === "hang";
  return (
    <>
      <View style={{ gap: 10 }}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Label color={colors.gunmetal}>{t("hang.protocol")}</Label>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Swatch color={colors.gunmetal} label={hang ? t("hang.kindHang") : t("hang.lifts")} />
            <Swatch color={colors.petal} label={t("hang.rest")} short />
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          <PhaseBar protocol={workout} height={14} />
        </View>
        <Text style={[type.mono, { fontSize: 13, color: colors.gunmetal }]}>
          {protocolSummary(workout, workout.timeUnits)}
        </Text>
      </View>
      <StatGrid
        columns={3}
        stats={[
          { label: t("hang.statDuration"), value: humanDuration(totalSeconds(workout)) },
          hang
            ? { label: t("hang.statOnEdge"), value: humanDuration(timeOnEdge(workout)) }
            : { label: t("hang.statTotalLifts"), value: String(workout.reps * workout.sets) },
          {
            label: t("hang.statSets"),
            value: hang ? `${workout.sets} × ${workout.reps}` : String(workout.sets),
          },
        ]}
      />
    </>
  );
}
