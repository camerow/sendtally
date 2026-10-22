import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { todayIn } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, exerciseSummary, useExerciseSeries } from "@sendtally/features/statistics";
import { Chip } from "../../../components/Chip";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { StatGrid } from "../components/StatGrid";
import { type } from "../type";
import { ExerciseTrendCard } from "./ExerciseTrendCard";
import { RecentSessions } from "./RecentSessions";
import { exerciseInsight, exerciseStats } from "./exerciseText";
import type { ExerciseChartMetric } from "./types";

export type ExerciseTrendsProps = {
  /** The exercise to open on, by any spelling; the most often logged when absent. */
  exercise?: string;
};

/**
 * Per-exercise statistics: exercise chips, the best set (or estimated one-rep max) over
 * time with hollow attempts, the insight, stats and the last sessions. A plain column
 * for the host screen's scroll view; it loads its own data.
 */
export function ExerciseTrends({ exercise }: ExerciseTrendsProps): React.ReactElement {
  const api = useApi();
  const state = useExerciseSeries(api);
  const unit = useWeightUnit(api);
  const requested = exercise === undefined ? undefined : exerciseKey(exercise);
  const [seen, setSeen] = React.useState(requested);
  const [picked, setPicked] = React.useState(requested);
  const [chart, setChart] = React.useState<ExerciseChartMetric>("best");
  if (requested !== seen) {
    setSeen(requested);
    setPicked(requested);
  }

  if (state.status === "loading")
    return <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />;
  if (state.status === "error")
    return (
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {state.message}
      </Text>
    );
  const all = state.data;
  const series = all.find((s) => s.key === picked) ?? all[0];
  const summary = series === undefined ? null : exerciseSummary(series, todayIn());
  if (series === undefined || summary === null)
    return <DashedPanel body={t("statistics.exercisesEmpty")} />;
  const hasE1rm = summary.e1rmKg !== null;
  const shown = hasE1rm ? chart : "best";

  return (
    <View style={{ gap: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
      >
        {all.map((s) => (
          <Chip
            key={s.key}
            label={s.name}
            active={s.key === series.key}
            uppercase={false}
            onPress={() => setPicked(s.key)}
          />
        ))}
      </ScrollView>
      {hasE1rm && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip
            label={t("statistics.bestSet")}
            active={shown === "best"}
            onPress={() => setChart("best")}
          />
          <Chip
            label={t("statistics.e1rm")}
            active={shown === "e1rm"}
            onPress={() => setChart("e1rm")}
          />
        </View>
      )}
      <ExerciseTrendCard series={series} chart={shown} unit={unit} />
      <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.gunmetal }]}>
        {exerciseInsight(series, summary, unit)}
      </Text>
      <StatGrid columns={2} stats={exerciseStats(series, summary, unit)} />
      <RecentSessions sessions={series.sessions} unit={unit} />
    </View>
  );
}
