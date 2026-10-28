import { router } from "expo-router";
import React from "react";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import type { LibraryWorkout, WorkoutUse } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { DetailActions } from "../components/DetailActions";
import { useHangData } from "../data/HangDataContext";
import { PlanList } from "../plans/PlanList";
import { AddToPlanFooter } from "./AddToPlanFooter";
import { BodyPreview } from "./BodyPreview";
import { LibraryIntro } from "./LibraryIntro";
import { StartButton } from "./StartButton";
import { useWorkoutDetailActions } from "./useWorkoutDetailActions";
import { WorkoutRuns } from "./WorkoutRuns";

export type LibraryWorkoutScreenProps = { workout: LibraryWorkout; use: WorkoutUse | undefined };

/** A workout other than a hangboard one: what it holds, where it is planned, and starting or changing it. */
export function LibraryWorkoutScreen({
  workout,
  use,
}: LibraryWorkoutScreenProps): React.ReactElement {
  const { model, today } = useHangData();
  const exercises = useExercises(useApi()).state;
  const actions = useWorkoutDetailActions(workout);
  const openExercise = (name: string): (() => void) | undefined => {
    const found =
      exercises.status === "ready"
        ? exercises.data.find((e) => exerciseKey(e.name) === exerciseKey(name))
        : undefined;
    return found === undefined
      ? undefined
      : () => router.push({ pathname: "/exercise/[id]", params: { id: found.id } });
  };

  return (
    <ScreenFrame
      action={<DetailActions {...actions} />}
      footer={
        <AddToPlanFooter workoutId={workout.id}>
          <StartButton workout={workout} date={today} height={54} style={{ flex: 1 }} />
        </AddToPlanFooter>
      }
    >
      <LibraryIntro workout={workout} use={use} />
      <BodyPreview
        workout={workout}
        unit={model.settings.units}
        session={use?.count ?? 0}
        openExercise={openExercise}
      />
      <WorkoutRuns workout={workout} />
      <PlanList workoutId={workout.id} name={workout.name} empty={t("hang.notScheduled")} />
    </ScreenFrame>
  );
}
