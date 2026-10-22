import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useStatisticsOverview } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { StatGrid } from "../components/StatGrid";
import { type } from "../type";
import { TimeSplit } from "./TimeSplit";
import { WeeklyEffort } from "./WeeklyEffort";
import { WeeklySessions } from "./WeeklySessions";

/** Every kind of session together: weeks, effort, the headline numbers and where the time went. */
export function StatisticsOverview(): React.ReactElement {
  const state = useStatisticsOverview(useApi());
  if (state.status === "loading")
    return <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />;
  if (state.status === "error")
    return (
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {state.message}
      </Text>
    );
  const vm = state.data;
  if (vm.sessions === 0) return <DashedPanel body={t("statistics.empty")} />;
  return (
    <View style={{ gap: 16 }}>
      <WeeklySessions vm={vm} />
      <WeeklyEffort vm={vm} />
      <StatGrid columns={2} stats={vm.stats} />
      <TimeSplit kinds={vm.kinds} />
    </View>
  );
}
