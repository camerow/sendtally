import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { timeOnEdge, type HangWorkout } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { Label } from "../components/Label";
import { PhaseBar } from "../components/PhaseBar";
import { StatGrid } from "../components/StatGrid";
import { type } from "../type";
import { Swatch } from "./Swatch";

export type ProtocolPanelProps = {
  workout: HangWorkout;
  /** The workout's planned length, as its cards and meta line read it. */
  minutes: number | null;
};

/** The phase bar with its legend, the summary line, and the headline numbers. */
export function ProtocolPanel({ workout, minutes }: ProtocolPanelProps): React.ReactElement {
  const hang = workout.kind === "hang";
  return (
    <>
      <View style={{ gap: 10 }}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Label color={colors.gunmetal}>{t("hang.protocol")}</Label>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Swatch color={colors.azure} label={hang ? t("hang.kindHang") : t("hang.lifts")} />
            <Swatch color={colors.fern} label={t("hang.rest")} short />
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
          { label: t("hang.statDuration"), value: minutes === null ? "-" : durationLabel(minutes) },
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
