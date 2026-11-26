import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";
import { deleteCopy } from "@sendtally/features/training";
import {
  copyName,
  draftOf,
  useWorkoutActions,
  type LibraryWorkout,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import type { DetailActionsProps } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import type { DetailMenuRow } from "../components/types";
import type { AddToMenu } from "../components/useAddToMenu";
import { useCreateGate } from "../locks";
import { useAddToBlock } from "./useAddToBlock";

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

export type WorkoutDetailActions = {
  bar: DetailActionsProps;
  /** The sheet and toast behind the bar's Add to block. */
  addToBlock: AddToMenu;
};

/**
 * A workout's bar: Edit, then Add to block, Duplicate and Delete for the user's own; Add to
 * block and Duplicate for a built-in, both locked without access. Opened from a planned run it
 * cannot be edited there.
 */
export function useWorkoutDetailActions(
  workout: LibraryWorkout,
  { planned }: { planned: boolean }
): WorkoutDetailActions {
  const actions = useWorkoutActions(useApi(), reportFailure);
  const addToBlock = useAddToBlock(workout.name, workout.id);
  const mine = workout.source === "mine";
  const gate = useCreateGate("workout");
  const duplicate: DetailMenuRow = {
    icon: "copy",
    title: t("workouts.duplicate"),
    onPress: () => {
      const id = randomUUID();
      void actions.saveWorkout(id, { ...draftOf(workout), name: copyName(workout.name) });
      router.replace({ pathname: "/workout/[id]", params: { id } });
    },
  };
  const remove = deleteRow(
    deleteCopy("workout", workout.name),
    () => void actions.deleteWorkout(workout.id)
  );
  const menu = [
    ...(addToBlock.row === null ? [] : [gate(addToBlock.row)]),
    gate(duplicate),
    ...(mine ? [remove] : []),
  ];
  const edit = () => router.push({ pathname: "/workout/edit", params: { id: workout.id } });
  return { bar: mine && !planned ? { onEdit: edit, menu } : { menu }, addToBlock };
}
