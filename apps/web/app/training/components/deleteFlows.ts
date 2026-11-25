import { t } from "@sendtally/features/i18n";

/** What a ··· delete says: its item, then the confirm it opens. */
export type DeleteFlow = { item: string; title: string; body: string; action: string };

/** A workout of the user's own. */
export const deleteWorkoutFlow = (name: string): DeleteFlow => ({
  item: t("workouts.delete"),
  title: t("workouts.deleteTitle", { name }),
  body: t("workouts.deleteBody"),
  action: t("common.delete"),
});

/** An exercise of the user's own: archived while a workout or the log uses it, else deleted. */
export const removeExerciseFlow = (name: string, inUse: boolean): DeleteFlow => ({
  item: inUse ? t("workouts.archiveExercise") : t("common.delete"),
  title: inUse
    ? t("workouts.archiveExerciseTitle", { name })
    : t("workouts.deleteExerciseTitle", { name }),
  body: inUse ? t("workouts.archiveExerciseBody") : t("workouts.deleteExerciseBody"),
  action: inUse ? t("workouts.archiveExercise") : t("common.delete"),
});

/** A grip of the user's own, archived so its sessions keep its name. */
export const archiveGripFlow = (name: string): DeleteFlow => removeExerciseFlow(name, true);

/** A block or template. */
export const deleteBlockFlow = (name: string): DeleteFlow => ({
  item: t("plan.deleteBlock"),
  title: t("plan.deleteBlockTitle", { name }),
  body: t("plan.deleteBlockBody"),
  action: t("common.delete"),
});
