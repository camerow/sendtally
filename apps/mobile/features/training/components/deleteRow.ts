import { t } from "@sendtally/features/i18n";
import { goBack } from "../../../lib/goBack";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import type { DetailMenuRow } from "./types";

type DeleteRow = { item: string; title: string; body?: string; action?: string };

/** The red last row of a ··· sheet: asks first, then goes back, unless told to stay, and removes the thing. */
export function deleteRow(
  { item, title, body, action }: DeleteRow,
  onDelete: () => void,
  stay = false
): DetailMenuRow {
  return {
    icon: "trash",
    title: item,
    danger: true,
    onPress: () =>
      confirmDestructive({
        title,
        body,
        action: action ?? t("common.delete"),
        onConfirm: () => {
          if (!stay) goBack();
          onDelete();
        },
      }),
  };
}
