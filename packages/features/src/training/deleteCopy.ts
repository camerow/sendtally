import { t } from "../i18n";

export type DeleteCopy = { item: string; title: string; body: string; action: string };

export type DeleteKind = "workout" | "exercise" | "grip" | "block";

export function deleteCopy(kind: DeleteKind, name: string, inUse = false): DeleteCopy {
  if (kind === "workout")
    return {
      item: t("workouts.delete"),
      title: t("workouts.deleteTitle", { name }),
      body: t("workouts.deleteBody"),
      action: t("common.delete"),
    };
  if (kind === "block")
    return {
      item: t("plan.deleteBlock"),
      title: t("plan.deleteBlockTitle", { name }),
      body: t("plan.deleteBlockBody"),
      action: t("common.delete"),
    };
  return kind === "grip" || inUse
    ? {
        item: t("workouts.archiveExercise"),
        title: t("workouts.archiveExerciseTitle", { name }),
        body: t("workouts.archiveExerciseBody"),
        action: t("workouts.archiveExercise"),
      }
    : {
        item: t("common.delete"),
        title: t("workouts.deleteExerciseTitle", { name }),
        body: t("workouts.deleteExerciseBody"),
        action: t("common.delete"),
      };
}
