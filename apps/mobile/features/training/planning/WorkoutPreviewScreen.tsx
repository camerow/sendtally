import { router } from "expo-router";
import React from "react";
import { t } from "@sendtally/features/i18n";
import type { LibraryWorkout, WorkoutUse } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BodyPreview } from "../library-detail/BodyPreview";
import { LibraryIntro } from "../library-detail/LibraryIntro";
import { StartButton } from "../library-detail/StartButton";
import { useWorkoutDetailActions } from "../library-detail/useWorkoutDetailActions";
import { useLibrary } from "../library/useLibrary";
import { addFlowParams, type AddFlow } from "./flowParams";

export type WorkoutPreviewScreenProps = {
  id: string;
  /** Opened while adding to the plan: Add goes on to when, else it can be started or edited. */
  adding: AddFlow | null;
};

function Preview({
  workout,
  use,
  adding,
}: {
  workout: LibraryWorkout;
  use: WorkoutUse | undefined;
  adding: AddFlow | null;
}): React.ReactElement {
  const { model, today } = useHangData();
  const actions = useWorkoutDetailActions(workout);
  return (
    <ScreenFrame
      action={adding === null && <DetailActions {...actions} />}
      footer={
        adding === null ? (
          <StartButton workout={workout} date={today} height={54} />
        ) : (
          <Button
            label={t("plan.addToPlan")}
            onPress={() =>
              router.push({
                pathname: "/plan/schedule",
                params: { workoutId: workout.id, ...addFlowParams(adding) },
              })
            }
            variant="primary"
            height={54}
            icon="plus"
          />
        )
      }
    >
      <LibraryIntro workout={workout} use={use} />
      <BodyPreview workout={workout} unit={model.settings.units} session={use?.count ?? 0} />
    </ScreenFrame>
  );
}

/** A workout read through before it is planned or run: what it holds and what its next session takes. */
export function WorkoutPreviewScreen({
  id,
  adding,
}: WorkoutPreviewScreenProps): React.ReactElement | null {
  const { state, reload } = useLibrary();
  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;
  const workout = state.data.workout(id);
  return workout === undefined ? null : (
    <Preview workout={workout} use={state.data.usage.get(id)} adding={adding} />
  );
}
