import React from "react";
import { DetailMenu } from "./DetailMenu";
import type { DetailMenuRow, LongPress } from "./types";

export type HoldMenu = {
  /** The long press that offers this one row in the sheet. */
  hold: (row: DetailMenuRow) => LongPress;
  sheet: React.ReactElement;
};

/** One sheet for a list, opened by holding a row, offering that row's one action. */
export function useHoldMenu(): HoldMenu {
  const [row, setRow] = React.useState<DetailMenuRow | null>(null);
  const [open, setOpen] = React.useState(false);
  return {
    hold: (held) => ({
      label: held.title,
      onPress: () => {
        setRow(held);
        setOpen(true);
      },
    }),
    sheet: (
      <DetailMenu
        rows={row === null ? [] : [row]}
        open={open}
        onOpenChange={setOpen}
        button={null}
      />
    ),
  };
}
