import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
  exerciseWorkout,
  pickWith,
  wrapperOf,
  type ExerciseEntry,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import type { AddToMenu } from "../components/useAddToMenu";
import type { DetailMenuRow } from "../components/types";
import { useAddToBlock } from "../library-detail/useAddToBlock";
import { useLibrary } from "../library/useLibrary";
import { useMakeExercise } from "./useMakeExercise";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type ExerciseInPlan = { block: AddToMenu; schedule: DetailMenuRow };

/**
 * An exercise's Add to block and Schedule: either puts in its one-exercise workout, made when
 * it is first added, so backing out of Schedule leaves nothing behind.
 */
export function useExerciseInPlan(entry: ExerciseEntry): ExerciseInPlan {
  const library = useLibrary().state;
  const save = useWorkoutActions(useApi(), failed).saveWorkout;
  const pick = pickWith(useMakeExercise());
  const workouts = library.status === "ready" ? library.data.workouts : [];
  const wrapper = wrapperOf(workouts, entry);
  const ensure = exerciseWorkout({ workouts, pick, save, newId: randomUUID });
  const { source } = entry;
  const exerciseId =
    "exercise" in source ? source.exercise.id : "builtIn" in source ? source.builtIn.id : "";
  return {
    block: useAddToBlock(entry.name, wrapper?.id, () => ensure(entry)),
    schedule: {
      icon: "today",
      title: t("plan.schedule"),
      onPress: () =>
        router.push({
          pathname: "/plan/schedule",
          params: wrapper === undefined ? { exerciseId } : { workoutId: wrapper.id },
        }),
    },
  };
}
