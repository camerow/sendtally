import { router } from "expo-router";
import { t } from "@sendtally/features/i18n";
import { confirmDestructive, type ConfirmDestructive } from "../../../lib/confirmDestructive";
import type { DetailMenuRow } from "./types";

export type DeleteRow = {
  title: string;
  /** What goes with it, or what stays. */
  hint: string;
  confirm: Omit<ConfirmDestructive, "onConfirm" | "action"> & { action?: string };
  onDelete: () => void;
};

/** The red last row of a ··· sheet: asks first, then goes back and removes the thing. */
export function deleteRow({ title, hint, confirm, onDelete }: DeleteRow): DetailMenuRow {
  return {
    icon: "trash",
    title,
    hint,
    danger: true,
    onPress: () =>
      confirmDestructive({
        ...confirm,
        action: confirm.action ?? t("common.delete"),
        onConfirm: () => {
          router.back();
          onDelete();
        },
      }),
  };
}
