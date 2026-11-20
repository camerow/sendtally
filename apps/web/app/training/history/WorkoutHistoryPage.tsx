import React from "react";
import { useActivities, workoutHistory } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { HistoryRow } from "../../components/detail/HistoryRow";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { activityPath } from "../log/paths";

export type WorkoutHistoryPageProps = {
  id: string;
  /** The finished workout it was opened from, marked in the list. */
  current?: string;
};

/** Every past session of one workout, newest first, each opening its finished workout. */
export function WorkoutHistoryPage({
  id,
  current,
}: WorkoutHistoryPageProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  const activities = useActivities(useAppApi());
  const { model } = useHangData();
  if (state.status !== "ready") return <LoadState state={state} onRetry={() => void reload()} />;
  if (activities.state.status !== "ready")
    return <LoadState state={activities.state} onRetry={() => void activities.reload()} />;
  const workout = state.data.workout(id);
  if (workout === undefined) return null;
  const history = workoutHistory(activities.state.data, model, id, current);
  return (
    <DetailFrame backTo={`/app/train/workouts/${encodeURIComponent(id)}`}>
      <div className="intro">
        <span className="train-label" style={{ color: KIND_LOOK[workout.kind].ink }}>
          {t("common.history")}
        </span>
        <h1 className="train-title history-title">{workout.name}</h1>
      </div>
      <div>
        {history.length === 0 ? (
          <p className="intro-body">{t("workouts.noSessionsYet")}</p>
        ) : (
          history.map((item) => (
            <HistoryRow key={item.id} item={item} byDay to={activityPath(item.id)} />
          ))
        )}
      </div>
    </DetailFrame>
  );
}
