import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";
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

const reportFailure = (): void => Alert.alert(t("workouts.saveFailed"));

/** A workout's bar: Edit, Duplicate and Delete for the user's own; Duplicate for a built-in. */
export function useWorkoutDetailActions(workout: LibraryWorkout): DetailActionsProps {
  const actions = useWorkoutActions(useApi(), reportFailure);
  const mine = workout.source === "mine";
  const duplicate: DetailMenuRow = {
    icon: "copy",
    title: t("workouts.duplicate"),
    hint: t("workouts.duplicateHint"),
    onPress: () => {
      const id = randomUUID();
      void actions.saveWorkout(id, { ...draftOf(workout), name: copyName(workout.name) });
      router.push({ pathname: "/workout/[id]", params: { id } });
    },
  };
  const remove = deleteRow({
    title: t("workouts.delete"),
    hint: t("workouts.deleteBody"),
    confirm: {
      title: t("workouts.deleteTitle", { name: workout.name }),
      body: t("workouts.deleteBody"),
    },
    onDelete: () => void actions.deleteWorkout(workout.id),
  });
  return mine
    ? {
        onEdit: () => router.push({ pathname: "/workout/edit", params: { id: workout.id } }),
        menu: [duplicate, remove],
      }
    : { menu: [duplicate] };
}
