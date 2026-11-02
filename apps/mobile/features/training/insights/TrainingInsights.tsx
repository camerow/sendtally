import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { ACTIVITY_KINDS, useTrainingInsights } from "@sendtally/features/statistics";
import type { TrendRange } from "@sendtally/features/trends";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { CurrentBlockRow } from "./CurrentBlockRow";
import { ExerciseGroups } from "./ExerciseGroups";
import { InsightsChart } from "./InsightsChart";
import { TrainedMix } from "./TrainedMix";

/** How hard and how often, what was trained, the block running, and every exercise's trend. */
export function TrainingInsights({ range }: { range: TrendRange }): React.ReactElement {
  const api = useApi();
  const { model } = useHangData();
  const state = useTrainingInsights(api, range, ACTIVITY_KINDS, model.gripName);

  if (state.status === "loading")
    return <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />;
  if (state.status === "error")
    return (
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {state.message}
      </Text>
    );
  if (state.data.sessions === 0) return <DashedPanel body={t("statistics.empty")} />;
  return (
    <>
      <Text style={[type.mono, { fontSize: 12.5, color: colors.textSecondary }]}>
        {state.data.line}
      </Text>
      <InsightsChart points={state.data.points} />
      <TrainedMix
        trained={state.data.trained}
        byFocus={state.data.byFocus}
        total={state.data.total}
      />
      <CurrentBlockRow />
      <ExerciseGroups groups={state.data.exercises} />
    </>
  );
}
