import React from "react";
import { Link } from "react-router";
import type { Exercise } from "@sendtally/api-client";
import {
  exerciseItems,
  kindLabel,
  useActivities,
  useWeightUnit,
} from "@sendtally/features/activities";
import { exerciseLabel, pickedOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { MoreMenu } from "../../components/MoreMenu";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { HistoryList } from "../../components/detail/HistoryList";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryMark } from "../components/CategoryMark";
import { DashedPanel } from "../components/DashedPanel";
import { ExerciseTrendCard } from "../components/ExerciseTrendCard";
import { UsedIn } from "../components/UsedIn";
import { LoadState } from "../data/LoadState";
import { editExercisePath } from "../editor/paths";
import { useAddToWorkout } from "../editor/useAddToWorkout";
import { useLibrary } from "../library/useLibrary";
import { activityPath } from "../log/paths";
import { EXERCISES_VIEW } from "./paths";
import { useExerciseMenu } from "./useExerciseMenu";

function Detail({
  exercise,
  all,
}: {
  exercise: Exercise;
  all: readonly Exercise[];
}): React.ReactElement {
  const api = useAppApi();
  const series = useExerciseSeries(api);
  const activities = useActivities(api).state;
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  const logged =
    series.status === "ready"
      ? series.data.find((s) => s.key === exerciseKey(exercise.name))
      : undefined;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, exercise.name) : [];
  const addTo = useAddToWorkout({
    name: exerciseLabel(exercise),
    picked: pickedOf({ exercise }),
    fingers: false,
    usedIn,
  });
  const menu = useExerciseMenu(
    exercise,
    all.filter((e) => e.id !== exercise.id),
    usedIn.length > 0 || logged !== undefined
  );
  const history =
    logged === undefined
      ? []
      : exerciseItems(logged, activities.status === "ready" ? activities.data : [], unit);

  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      action={
        <span className="detail-actions">
          <Link to={editExercisePath(exercise.id)} className="edit-button">
            {t("common.edit")}
          </Link>
          <MoreMenu
            label={t("summary.more")}
            items={[
              ...(addTo.item === null || exercise.archived ? [] : [addTo.item]),
              ...menu.items,
            ]}
          />
        </span>
      }
    >
      <div className="intro">
        <span className="intro-kicker">
          <CategoryMark kind={exercise.kind} size={28} />
          <span className="train-label">{kindLabel(exercise.kind)}</span>
        </span>
        <h1 className="train-title intro-title">{exerciseLabel(exercise)}</h1>
      </div>
      {logged === undefined ? (
        <DashedPanel body={t("workouts.exerciseNothingLogged")} />
      ) : (
        <>
          {logged.untracked !== true && <ExerciseTrendCard series={logged} unit={unit} />}
          <HistoryList items={history} to={activityPath} />
        </>
      )}
      <UsedIn workouts={usedIn} />
      {menu.sheets}
      {addTo.sheet}
    </DetailFrame>
  );
}

/** One exercise: its best-set trend, its last sessions and the workouts that use it. */
export function ExercisePage({ id }: { id: string }): React.ReactElement | null {
  const exercises = useExercises(useAppApi());
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const all = exercises.state.data;
  const exercise = all.find((e) => e.id === id);
  return exercise === undefined ? null : <Detail exercise={exercise} all={all} />;
}
