import React from "react";
import type { CalendarDate, DatedBlock } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { useHangData } from "../data/HangDataContext";
import { StartPicker } from "./StartPicker";

export type MoveStartSheetProps = {
  block: DatedBlock;
  onPick: (start: CalendarDate) => void;
  onClose: () => void;
};

/** Picking another first day for a block that has not started; its plans move with it. */
export function MoveStartSheet({
  block,
  onPick,
  onClose,
}: MoveStartSheetProps): React.ReactElement {
  const { today } = useHangData();
  const [start, setStart] = React.useState(block.start);
  return (
    <Sheet
      open
      kicker={block.name}
      title={t("plan.planAgainStart")}
      onClose={onClose}
      action={{
        label: t("plan.startOn", { day: shortDate(start) }),
        disabled: start === block.start,
        onPress: () => {
          onPick(start);
          onClose();
        },
      }}
    >
      <StartPicker block={block} start={start} today={today} onPick={setStart} />
    </Sheet>
  );
}
