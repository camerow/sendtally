import React from "react";
import { ScrollView, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { byDate, seriesFor, summarise } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Chip } from "../../../components/Chip";
import { DashedPanel } from "../components/DashedPanel";
import { StatGrid } from "../components/StatGrid";
import { useHangData } from "../data/HangDataContext";
import { HangDataProvider } from "../data/HangDataProvider";
import { type } from "../type";
import { Consistency } from "./Consistency";
import { TrendCard } from "./TrendCard";
import { insight, trendStats } from "./trendText";

export type HangboardTrendsProps = {
  /** The workout and grip to open on; the latest logged ones when absent. */
  workoutId?: string;
  gripId?: string;
};

type Picked = { workout?: string; grip?: string };

function Trends({ workoutId, gripId: requestedGrip }: HangboardTrendsProps): React.ReactElement {
  const { model, today } = useHangData();
  const requested = `${workoutId ?? ""}:${requestedGrip ?? ""}`;
  const [seen, setSeen] = React.useState(requested);
  const [picked, setPicked] = React.useState<Picked>({ workout: workoutId, grip: requestedGrip });
  if (requested !== seen) {
    setSeen(requested);
    setPicked({ workout: workoutId, grip: requestedGrip });
  }

  const withHistory = model.workouts.filter((w) =>
    model.sessions.some((s) => s.workoutId === w.id)
  );
  const workout = withHistory.find((w) => w.id === picked.workout) ?? withHistory[0];
  const logged =
    workout === undefined
      ? []
      : model.sessions.filter((s) => s.workoutId === workout.id).sort(byDate);
  const grips = [...new Set(logged.map((s) => s.gripId))];
  const gripId = grips.includes(picked.grip ?? "")
    ? picked.grip
    : logged[logged.length - 1]?.gripId;
  const series =
    workout === undefined || gripId === undefined
      ? []
      : seriesFor(model.sessions, workout.id, gripId);
  const summary = summarise(series, today);
  const unit = model.settings.units;
  const ctx =
    workout === undefined || gripId === undefined
      ? null
      : { workout: workout.name, grip: model.gripName(gripId), kind: workout.kind, unit };

  return (
    <View style={{ gap: 16 }}>
      {withHistory.length === 0 && <DashedPanel body={t("hang.trendsNone")} />}
      {withHistory.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -18 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
        >
          {withHistory.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              active={w.id === workout?.id}
              uppercase={false}
              onPress={() => setPicked({ workout: w.id })}
            />
          ))}
        </ScrollView>
      )}
      {grips.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {grips.map((g) => (
            <Chip
              key={g}
              label={model.gripName(g)}
              active={g === gripId}
              uppercase={false}
              onPress={() => setPicked({ workout: workout?.id, grip: g })}
            />
          ))}
        </View>
      )}
      {summary !== null && ctx !== null && workout !== undefined && (
        <>
          <TrendCard
            workout={workout.name}
            grip={ctx.grip}
            series={series}
            summary={summary}
            kind={workout.kind}
            unit={unit}
          />
          <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.gunmetal }]}>
            {insight(summary, ctx)}
          </Text>
          <StatGrid columns={2} stats={trendStats(series, summary, ctx)} />
        </>
      )}
      {withHistory.length > 0 && summary === null && <DashedPanel body={t("hang.trendEmpty")} />}
      <Consistency />
    </View>
  );
}

/**
 * Hangboard trends: workout and grip chips, the load chart with hollow partials, the
 * insight, stats and sixteen weeks of consistency. A plain column for the host screen's
 * own scroll view, padded 18 at the sides like the app's screens; it loads its own data.
 */
export function HangboardTrends(props: HangboardTrendsProps): React.ReactElement {
  return (
    <HangDataProvider>
      <Trends {...props} />
    </HangDataProvider>
  );
}
