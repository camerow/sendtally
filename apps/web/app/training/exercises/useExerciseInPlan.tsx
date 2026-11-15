import React from "react";
import { useNavigate } from "react-router";
import {
  exerciseWorkout,
  pickWith,
  wrapperOf,
  type ExerciseEntry,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useWorkoutActions } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useAddToBlock, type AddToBlock } from "../blocks/useAddToBlock";
import { useMake } from "../editor/useMake";
import { useLibrary } from "../library/useLibrary";
import { exerciseSchedulePath, schedulePath } from "../schedule/paths";

export type ExerciseInPlan = { block: AddToBlock; schedule: MoreMenuItem };

/**
 * An exercise's Add to block and Schedule: either puts in its one-exercise workout, made when
 * it is first added, so backing out of Schedule leaves nothing behind.
 */
export function useExerciseInPlan(entry: ExerciseEntry): ExerciseInPlan {
  const navigate = useNavigate();
  const toast = useToast();
  const failed = React.useCallback(
    () => toast.show({ message: t("workouts.saveFailed") }),
    [toast]
  );
  const library = useLibrary().state;
  const save = useWorkoutActions(useAppApi(), failed).saveWorkout;
  const pick = pickWith(useMake());
  const workouts = library.status === "ready" ? library.data.workouts : [];
  const wrapper = wrapperOf(workouts, entry);
  const ensure = exerciseWorkout({ workouts, pick, save, newId: () => crypto.randomUUID() });
  const { source } = entry;
  const exerciseId =
    "exercise" in source ? source.exercise.id : "builtIn" in source ? source.builtIn.id : "";
  return {
    block: useAddToBlock(entry.name, wrapper?.id, () => ensure(entry)),
    schedule: {
      label: t("plan.schedule"),
      onSelect: () =>
        void navigate(
          wrapper === undefined ? exerciseSchedulePath(exerciseId) : schedulePath(wrapper.id)
        ),
    },
  };
}
