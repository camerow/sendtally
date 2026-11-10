import React from "react";
import { t } from "@sendtally/features/i18n";
import type { ToastProps } from "../../../components/Toast";
import type { AddToSheetProps } from "./AddToSheet";
import type { AddToOption, DetailMenuRow } from "./types";

export type AddToMenuArgs = {
  /** The ··· row and the sheet's title, such as Add to block. */
  title: string;
  /** What is being added. */
  name: string;
  options: readonly AddToOption[];
  add: (id: string) => void;
  /** Opens where it went, from the toast's View. */
  view: (id: string) => void;
};

export type AddToMenu = {
  /** Null when there is nowhere to add it. */
  row: DetailMenuRow | null;
  /** While the pick sheet is open. */
  sheet: AddToSheetProps | null;
  /** After a pick, saying where it went. */
  toast: ToastProps | null;
};

/** A ··· row adding this somewhere: it opens the pick sheet, and a toast says where it went. */
export function useAddToMenu({ title, name, options, add, view }: AddToMenuArgs): AddToMenu {
  const [open, setOpen] = React.useState(false);
  const [added, setAdded] = React.useState<AddToOption | null>(null);
  return {
    row: options.length === 0 ? null : { icon: "plus", title, onPress: () => setOpen(true) },
    sheet: open
      ? {
          kicker: name,
          title,
          options,
          onPick: (o) => {
            add(o.id);
            setAdded(o);
          },
          onClose: () => setOpen(false),
        }
      : null,
    toast:
      added === null
        ? null
        : {
            message: t("common.addedTo", { name: added.label }),
            action: { label: t("common.view"), onPress: () => view(added.id) },
            onHide: () => setAdded(null),
          },
  };
}
