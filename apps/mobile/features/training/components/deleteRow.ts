import { t } from "@sendtally/features/i18n";
import { goBack } from "../../../lib/goBack";
import { confirmDestructive, type ConfirmDestructive } from "../../../lib/confirmDestructive";
import type { DetailMenuRow } from "./types";

export type DeleteRow = {
  title: string;
  confirm: Omit<ConfirmDestructive, "onConfirm" | "action"> & { action?: string };
  onDelete: () => void;
};

/** The red last row of a ··· sheet: asks first, then goes back, unless told to stay, and removes the thing. */
export function deleteRow({ title, confirm, onDelete }: DeleteRow, stay = false): DetailMenuRow {
  return {
    icon: "trash",
    title,
    danger: true,
    onPress: () =>
      confirmDestructive({
        ...confirm,
        action: confirm.action ?? t("common.delete"),
        onConfirm: () => {
          if (!stay) goBack();
          onDelete();
        },
      }),
  };
}

/** A workout of the user's own. */
export const deleteWorkoutRow = (name: string, onDelete: () => void, stay = false): DetailMenuRow =>
  deleteRow(
    {
      title: t("workouts.delete"),
      confirm: { title: t("workouts.deleteTitle", { name }), body: t("workouts.deleteBody") },
      onDelete,
    },
    stay
  );

/** An exercise of the user's own: archived while a workout or the log uses it, else deleted. */
export const removeExerciseRow = (
  name: string,
  inUse: boolean,
  onDelete: () => void,
  stay = false
): DetailMenuRow =>
  deleteRow(
    {
      title: inUse ? t("workouts.archiveExercise") : t("common.delete"),
      confirm: {
        title: inUse
          ? t("workouts.archiveExerciseTitle", { name })
          : t("workouts.deleteExerciseTitle", { name }),
        body: inUse ? t("workouts.archiveExerciseBody") : t("workouts.deleteExerciseBody"),
        action: inUse ? t("workouts.archiveExercise") : t("common.delete"),
      },
      onDelete,
    },
    stay
  );

/** A grip of the user's own, archived so its sessions keep its name. */
export const archiveGripRow = (name: string, onDelete: () => void, stay = false): DetailMenuRow =>
  removeExerciseRow(name, true, onDelete, stay);

/** A block or template. */
export const deleteBlockRow = (name: string, onDelete: () => void, stay = false): DetailMenuRow =>
  deleteRow(
    {
      title: t("plan.deleteBlock"),
      confirm: { title: t("plan.deleteBlockTitle", { name }), body: t("plan.deleteBlockBody") },
      onDelete,
    },
    stay
  );
