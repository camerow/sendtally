import React from "react";
import { useHangData } from "../data/HangDataContext";
import { libraryPictures } from "@sendtally/features/library";
import { Link, Navigate } from "react-router";
import type { Exercise } from "@sendtally/api-client";
import { exerciseItems, kindLabel, useActivities } from "@sendtally/features/activities";
import {
  builtInExercise,
  exerciseDescription,
  exerciseLabel,
  pickedOf,
} from "@sendtally/features/exercises";
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
import { joinPath, useCreateGate, useLocks } from "../locks";
import { activityPath } from "../log/paths";
import { Description } from "../components/Description";
import { BuiltInExercisePage } from "./BuiltInExercisePage";
import { EXERCISES_VIEW } from "./paths";
import { useExerciseInPlan } from "./useExerciseInPlan";
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
  const unit = useHangData().model.settings.units;
  const logged =
    series.status === "ready"
      ? series.data.find((s) => s.key === exerciseKey(exercise.name))
      : undefined;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, exercise.name) : [];
  const addTo = useAddToWorkout({
    name: exerciseLabel(exercise),
    pick: async () => pickedOf({ exercise }),
    fingers: false,
    usedIn,
  });
  const inPlan = useExerciseInPlan({
    kind: exercise.kind,
    name: exerciseLabel(exercise),
    source: { exercise },
  });
  const gate = useCreateGate("exercise");
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
      hero={libraryPictures("exercise", exercise.builtIn)}
      action={
        <span className="detail-actions">
          <Link to={editExercisePath(exercise.id)} className="edit-button">
            {t("common.edit")}
          </Link>
          <MoreMenu
            label={t("summary.more")}
            items={[
              ...(exercise.archived
                ? []
                : [
                    ...[addTo.item, inPlan.block.item].filter((i) => i !== null).map(gate),
                    inPlan.schedule,
                  ]),
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
        <Description text={exerciseDescription(exercise)} fold />
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
      {inPlan.block.sheet}
    </DetailFrame>
  );
}

/**
 * One exercise: its best-set trend, its last sessions and the workouts that use it. A built-in id
 * opens the user's own copy once they have one, else the built-in itself.
 */
export function ExercisePage({ id }: { id: string }): React.ReactElement | null {
  const exercises = useExercises(useAppApi());
  const locks = useLocks();
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;
  const all = exercises.state.data;
  const exercise = all.find((e) => e.id === id || (e.builtIn === id && !e.archived));
  if (exercise !== undefined)
    return locks.exercise({ exercise }) ? (
      <Navigate to={joinPath("exercise")} replace />
    ) : (
      <Detail exercise={exercise} all={all} />
    );
  const builtIn = builtInExercise(id);
  return builtIn === undefined ? null : <BuiltInExercisePage builtIn={builtIn} />;
}
