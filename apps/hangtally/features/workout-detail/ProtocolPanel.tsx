import React from "react";
import { Text, View } from "react-native";
import { timeOnEdge, totalSeconds, type Workout } from "@sendtally/core/hang";
import { humanDuration, protocolSummary } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { PhaseBar } from "../../components/PhaseBar";
import { StatGrid } from "../../components/StatGrid";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { Swatch } from "./Swatch";

/** The phase bar with its legend, the summary line, and the headline numbers. */
export function ProtocolPanel({ workout }: { workout: Workout }): React.ReactElement {
  const c = useTheme();
  const hang = workout.kind === "hang";
  return (
    <>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row" }}>
          <PhaseBar protocol={workout} height={28} />
        </View>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Swatch color={c.accent} label={hang ? t("hang.kindHang") : t("hang.lifts")} />
          <Swatch color={c.rest} label={t("hang.rest")} />
        </View>
        <Text style={[type.mono, { fontSize: 14, color: c.onDark }]}>
          {protocolSummary(workout, workout.timeUnits)}
        </Text>
      </View>
      <StatGrid
        columns={3}
        valueSize={18}
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
