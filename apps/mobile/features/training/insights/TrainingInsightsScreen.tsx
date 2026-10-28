import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { ACTIVITY_KINDS, useTrainingInsights } from "@sendtally/features/statistics";
import { PREVIEW_TREND_RANGE, shownRange, type TrendRange } from "@sendtally/features/trends";
import { InsightsFrame } from "../../../components/InsightsFrame";
import { useApi } from "../../../lib/api";
import { useCanSeeInsights } from "../../billing/useBilling";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { CurrentBlockRow } from "./CurrentBlockRow";
import { ExerciseGroups } from "./ExerciseGroups";
import { InsightsChart } from "./InsightsChart";
import { TrainedMix } from "./TrainedMix";

/** How hard and how often, what was trained, the block running, and every exercise's trend. */
export function TrainingInsightsScreen(): React.ReactElement {
  const api = useApi();
  const { model } = useHangData();
  const member = useCanSeeInsights();
  const [picked, setPicked] = React.useState<TrendRange>(PREVIEW_TREND_RANGE);
  const range = shownRange(member, picked);
  const state = useTrainingInsights(api, range, ACTIVITY_KINDS, model.gripName);

  return (
    <InsightsFrame
      back={t("journal.log")}
      title={t("statistics.trainingInsights")}
      member={member}
      range={range}
      onRange={setPicked}
    >
      {state.status === "loading" ? (
        <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
      ) : state.status === "error" ? (
        <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
          {state.message}
        </Text>
      ) : state.data.sessions === 0 ? (
        <DashedPanel body={t("statistics.empty")} />
      ) : (
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
      )}
    </InsightsFrame>
  );
}
