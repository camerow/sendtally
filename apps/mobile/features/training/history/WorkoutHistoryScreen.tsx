import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivities, useWorkoutHistory } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
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
  const api = useApi();
  const activities = useActivities(api);
  const history = useWorkoutHistory(api, id, current);
  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;
  if (history.status !== "ready")
    return <LoadState state={history} onRetry={() => void activities.reload()} framed />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  return (
    <ScreenFrame>
      <View style={{ gap: 6, paddingBottom: 8 }}>
        <Label color={KIND_LOOK[workout.kind].ink}>{t("common.history")}</Label>
        <Title size={28}>{workout.name}</Title>
      </View>
      <View>
        {history.data.length === 0 ? (
          <Text style={[type.body, { fontSize: 15, color: colors.textSecondary }]}>
            {t("workouts.noSessionsYet")}
          </Text>
        ) : (
          history.data.map((item) => (
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
