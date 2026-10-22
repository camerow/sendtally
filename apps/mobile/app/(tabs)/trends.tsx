import React from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { useTrainingMode } from "@sendtally/features/settings";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Segmented } from "../../components/Segmented";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { StatisticsOverview } from "../../features/training/statistics/StatisticsOverview";
import type { StatisticsView } from "../../features/training/statistics/types";
import { useStatisticsView } from "../../features/training/statistics/useStatisticsView";
import { ExerciseTrends } from "../../features/training/exercises/ExerciseTrends";
import { HangboardTrends } from "../../features/training/trends/HangboardTrends";
import { TrendsList } from "../../features/trends/TrendsList";
import { useApi } from "../../lib/api";

const GAP = 14;

const VIEWS: Record<StatisticsView, MessageKey> = {
  overview: "statistics.overview",
  climbing: "statistics.climbing",
  hangboard: "statistics.hangboard",
  exercises: "statistics.exercises",
};

export default function Trends(): React.ReactElement {
  const canSeeInsights = useCanSeeInsights();
  const api = useApi();
  const training = useTrainingMode(api);
  const statistics = useStatisticsView();
  const view = training.enabled ? statistics.view : "climbing";
  const scroll = React.useRef<ScrollView>(null);
  const panelY = React.useRef(0);
  const viewportHeight = React.useRef(0);
  const contentHeight = React.useRef(0);
  const scrollToPanel = React.useCallback((): void => {
    const end = Math.max(0, contentHeight.current - viewportHeight.current);
    scroll.current?.scrollTo({ y: Math.min(panelY.current - GAP, end), animated: true });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader
        title={training.enabled ? t("training.statistics") : t("common.trends")}
        right={<AccountButton />}
      />
      <ScrollView
        ref={scroll}
        onLayout={(e) => (viewportHeight.current = e.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => (contentHeight.current = height)}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 24,
          gap: GAP,
        }}
      >
        {training.enabled && (
          <Segmented
            label={t("statistics.label")}
            segments={(Object.keys(VIEWS) as StatisticsView[]).map((v) => ({
              key: v,
              label: t(VIEWS[v]),
              on: v === view,
              onPress: () => statistics.setView(v),
            }))}
          />
        )}
        {view === "overview" && <StatisticsOverview />}
        {view === "hangboard" && (
          <HangboardTrends workoutId={statistics.workoutId} gripId={statistics.gripId} />
        )}
        {view === "exercises" && <ExerciseTrends />}
        {view === "climbing" && canSeeInsights === null && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {view === "climbing" && canSeeInsights !== null && (
          <TrendsList
            preview={!canSeeInsights}
            onLockedRange={scrollToPanel}
            onPaywallLayout={(y) => (panelY.current = y)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
