import { router } from "expo-router";
import { Alert } from "react-native";
import type { Exercise } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";

/** Merges one exercise into another once confirmed, then opens the one it went into. */
export function useMergeExercise(): (from: Exercise, into: Exercise) => void {
  const api = useApi();
  return (from, into) =>
    confirmDestructive({
      title: t("workouts.mergeExerciseTitle", { from: from.name, into: into.name }),
      body: t("workouts.mergeExerciseBody", { from: from.name, into: into.name }),
      action: t("workouts.merge"),
      onConfirm: () =>
        void api.mergeExercise(from.id, into.id).then(
          () => router.replace({ pathname: "/exercise/[id]", params: { id: into.id } }),
          () => Alert.alert(t("workouts.saveFailed"))
        ),
    });
}
