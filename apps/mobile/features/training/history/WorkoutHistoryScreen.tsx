import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivities, workoutHistory } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { type } from "../type";
import { HistoryRow } from "./HistoryRow";

export type WorkoutHistoryScreenProps = {
  id: string;
  /** The finished workout it was opened from, marked in the list. */
  current?: string;
};

/** Every past session of one workout, newest first, each opening its finished workout. */
export function WorkoutHistoryScreen({
  id,
  current,
}: WorkoutHistoryScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  const activities = useActivities(useApi());
  const { model } = useHangData();
  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;
  if (activities.state.status !== "ready")
    return <LoadState state={activities.state} onRetry={() => void activities.reload()} framed />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  const history = workoutHistory(activities.state.data, model, id, current);
  return (
    <ScreenFrame>
      <View style={{ gap: 6 }}>
        <Label color={KIND_LOOK[workout.kind].ink}>{t("common.history")}</Label>
        <Title size={28}>{workout.name}</Title>
      </View>
      <View>
        {history.length === 0 ? (
          <Text style={[type.body, { fontSize: 15, color: colors.textSecondary }]}>
            {t("workouts.noSessionsYet")}
          </Text>
        ) : (
          history.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              byDay
              onPress={() => router.push({ pathname: "/activity/[id]", params: { id: item.id } })}
            />
          ))
        )}
      </View>
    </ScreenFrame>
  );
}
