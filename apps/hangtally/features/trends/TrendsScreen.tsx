import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { byDate, seriesFor, summarise } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Chip } from "../../components/Chip";
import { DashedPanel } from "../../components/DashedPanel";
import { Label } from "../../components/Label";
import { StatGrid } from "../../components/StatGrid";
import { TabScreen } from "../../components/TabScreen";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { Consistency } from "./Consistency";
import { TrendCard } from "./TrendCard";
import { insight, trendStats } from "./trendText";

export function TrendsScreen(): React.ReactElement {
  const c = useTheme();
  const { model, today } = useHangData();
  const params = useLocalSearchParams<{ workout?: string; grip?: string }>();
  const requested = `${params.workout ?? ""}:${params.grip ?? ""}`;
  const [seen, setSeen] = React.useState(requested);
  const [picked, setPicked] = React.useState({ workout: params.workout, grip: params.grip });
  if (requested !== seen) {
    setSeen(requested);
    setPicked({ workout: params.workout, grip: params.grip });
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
    <TabScreen gap={18}>
      <Title size={38} color={c.onDark}>
        {t("hang.trendsTitle")}
      </Title>
      {withHistory.length === 0 && <DashedPanel body={t("hang.trendsNone")} />}
      {withHistory.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        >
          {withHistory.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              on={w.id === workout?.id}
              onPress={() => setPicked({ workout: w.id, grip: undefined })}
              fill={c.accent}
            />
          ))}
        </ScrollView>
      )}
      {grips.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <Label color={c.onDark3} style={{ paddingRight: 4 }}>
            {t("hang.grip")}
          </Label>
          {grips.map((g) => (
            <Chip
              key={g}
              label={model.gripName(g)}
              on={g === gripId}
              onPress={() => setPicked({ workout: workout?.id, grip: g })}
              fill={c.onDark}
              small
            />
          ))}
        </View>
      )}
      {summary !== null && ctx !== null && workout !== undefined && (
        <>
          <TrendCard
            workout={workout.name}
            series={series}
            summary={summary}
            kind={workout.kind}
            unit={unit}
          />
          <Text style={[type.body, { fontSize: 16, lineHeight: 24, color: c.onDark }]}>
            {insight(summary, ctx)}
          </Text>
          <StatGrid columns={2} stats={trendStats(series, summary, ctx)} />
        </>
      )}
      {withHistory.length > 0 && summary === null && <DashedPanel body={t("hang.trendEmpty")} />}
      <Consistency />
    </TabScreen>
  );
}
